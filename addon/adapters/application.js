import Ember from "ember";
import DS from "ember-data";

export default DS.RESTAdapter.extend({

  defaultSerializer: "-parse",
  host: "https://api.parse.com", // url of the parse-server (here default to Parse.com)
  namespace: "1", // url prefix of the API (here default to Parse.com used prefix)

  init: function() {
    this._super();
    this.set("headers", {
      "X-Parse-Application-Id" : Ember.get(this, "applicationId"),
      "X-Parse-REST-API-Key"   : Ember.get(this, "restApiId")
    });
  },

  pathForType: function(type) {
    if ("parseUser" === type || "parse-user" === type) {
      return "users";
    }
    else if ("requestPasswordReset" === type) {
      return "requestPasswordReset";
    }
    else if ("login" === type) {
      return "login";
    }
    else if ("logout" === type) {
      return "logout";
    }
    else if ("me" === type) {
      return "users/me";
    }
    else if ("function" === type) {
      return "functions";
    }
    else {
      return "classes/" + Ember.String.capitalize(Ember.String.camelize(type));
    }
  },

  normalizeErrorResponse: function(status, headers, payload) {
    if (payload && typeof payload === "object") {
      if (payload.errors) {
        return payload.errors;
      }
    }

    return [payload];
  },

  /**
  * Because Parse doesn't return a full set of properties on the
  * responses to updates, we want to perform a merge of the response
  * properties onto existing data so that the record maintains
  * latest data.
  */
  createRecord: function( store, type, snapshot ) {
    var serializer = store.serializerFor( type.modelName ),
      data       = {},
      adapter    = this;

    serializer.serializeIntoHash( data, type, snapshot, { includeId: true } );

    return new Ember.RSVP.Promise( function( resolve, reject ) {
      adapter.ajax( adapter.buildURL( type.modelName ), "POST", { data: data } ).then(
        function( json ) {
          resolve( Ember.merge( data, json ) );
        },
        function( reason ) {
          reject( reason.errors[0] );
        }
      );
    });
  },

  /**
  * Because Parse doesn't return a full set of properties on the
  * responses to updates, we want to perform a merge of the response
  * properties onto existing data so that the record maintains
  * latest data.
  */
  updateRecord: function(store, type, snapshot) {
    var serializer  = store.serializerFor( type.modelName ),
      id          = snapshot.id,
      sendDeletes = false,
      deleteds    = {},
      data        = {},
      adapter     = this;

    serializer.serializeIntoHash(data, type, snapshot, { includeId: true });

    // password cannot be empty
    if( !data.password && (type.modelName === "parseUser" || type.modelName === "parse-user") ) {
      delete data.password;
    }

    // username cannot be empty
    if( !data.username && (type.modelName === "parseUser" || type.modelName === "parse-user") ) {
      delete data.username;
    }

    type.eachRelationship(function( key ) {
      if ( data[key] && data[key].deleteds ) {
        deleteds[key] = data[key].deleteds;
        delete data[key].deleteds;
        sendDeletes = true;
      }
    });

    return new Ember.RSVP.Promise( function( resolve, reject ) {
      if ( sendDeletes ) {
        adapter.ajax( adapter.buildURL( type.modelName, id ), "PUT", { data: deleteds } ).then(
          function() {
            adapter.ajax( adapter.buildURL( type.modelName, id ), "PUT", { data: data } ).then(
              function( updates ) {
                // This is the essential bit - merge response data onto existing data.
                resolve( Ember.merge( data, updates ) );
              },
              function( reason ) {
                reject( "Failed to save parent in relation: " + reason.errors[0] );
              }
            );
          },
          function( reason ) {
            reject( reason.errors[0] );
          }
        );

      } else {
        adapter.ajax( adapter.buildURL( type.modelName, id ), "PUT", { data: data } ).then(
          function( json ) {
            // This is the essential bit - merge response data onto existing data.
            resolve( Ember.merge( data, json ) );
          },
          function( reason ) {
            reject( reason.errors[0] );
          }
        );
      }
    });
  },

  parseClassName: function ( key ) {
    return Ember.String.capitalize( key );
  },

  /**
  * Implementation of a hasMany that provides a Relation query for Parse
  * objects.
  */
  findHasMany: function( store, snapshot, url, relationship ) {
    var relatedInfo_ = JSON.parse( url ),
        query        = {
        where: {
          "$relatedTo": {
            "object": {
              "__type"    : "Pointer",
              "className" : this.parseClassName( snapshot.modelName ),
              "objectId"  : snapshot.id
            },
            key: relatedInfo_.key
          }
        }
    };

    // the request is to the related type and not the type for the record.
    // the query is where there is a pointer to this record.
    return this.ajax( this.buildURL( relationship.type ), "GET", { data: query } );
  },

  /**
  * Implementation of findQuery that automatically wraps query in a
  * JSON string.
  *
  * @example
  *     this.store.find("comment", {
  *       where: {
  *         post: {
  *             "__type":  "Pointer",
  *             "className": "Post",
  *             "objectId": post.get("id")
  *         }
  *       }
  *     });
  */
  query: function ( store, type, query ) {
    var _query = query;

    if ( _query.where && "string" !== Ember.typeOf( _query.where ) ) {
      _query.where = JSON.stringify( _query.where );
    }
    else if (( !_query.where ) && ( !_query.order ) && ( !_query.limit ) &&
             ( !_query.skip ) && ( !_query.keys ) && ( !_query.include )) {

      // example: store.query("person", { name: "Peter" })
      _query = { where: JSON.stringify(_query) };
    }

    // Pass to _super()
    return this._super( store, type, _query );
  },

  sessionToken: Ember.computed("headers.X-Parse-Session-Token", {
    get: function get() {
      return this.get("headers.X-Parse-Session-Token");
    },
    set: function set(key, value) {
      this.set("headers.X-Parse-Session-Token", value);
      return value;
    }
  })
});
