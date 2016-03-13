import Ember from "ember";
import { test } from "ember-qunit";
import startApp from "../../helpers/start-app";

var get = Ember.get;
var set = Ember.set;
var store;
var adapter;
var ParseUser;
var userIds;

module( "Integration - model:parse-user", {
  beforeEach: function() {
    App = startApp({
      applicationId: "appId",
      restApiId: "restApiId"
    });
		var container = App.__container__;

    store = container.lookup( "service:store" );
    adapter = store.adapterFor("application");
    ParseUser = store.modelFor( "parse-user" );
    userIds = [];
  },

  afterEach: function() {

    var adapter = store.adapterFor("application");
    var applicationId = adapter.get("applicationId");
    var restApiId = adapter.get("restApiId");
    var url = adapter.get("host") + "/parse/users/";

    for (var i = 0; i < userIds.length; i++) {

      var username = userIds[i].username;
      var password = userIds[i].password;

      andThen(function() {
        ParseUser.login( store, {username: username, password: password} ).then( function( user ) {
          return $.ajax({
            url: url + user.get("id"),
            type: "DELETE",
            beforeSend: function(request) {
              console.log("HERE: " + user.get("sessionToken"));
              request.setRequestHeader("X-Parse-Application-Id", applicationId);
              request.setRequestHeader("X-Parse-REST-API-Key", restApiId);
              request.setRequestHeader("X-Parse-Session-Token", user.get("sessionToken"));
              request.setRequestHeader("Content-Type", "application/json");
            }
          });
        });
      });
    }

    andThen(function() {
      Ember.run( App, App.destroy );
    });
  }
});


test("All operations", function( assert ) {
  assert.expect(18);

  // Signup
	andThen(function() {
    ParseUser.signup( store, {
      username : "clintjhill",
      password : "loveyouall",
      email    : "clint@foo.com"

    }).then( function( user ) {
      userIds.push({
        id: get( user, "id"),
        sessionToken: get( user, "sessionToken"),
        username: "clintjhill",
        password: "loveyouall"
      });

      assert.ok( !get( user, "isSaving"), "user is not saving" );
      assert.ok( !get( user, "hasDirtyAttributes"), "user is not dirty" );
      assert.notOk( Ember.isEmpty( userIds[0].id ), "Be sure objectId is set." );
      assert.notOk( Ember.isEmpty( userIds[0].sessionToken ), "Make sure session token set." );
      assert.equal( get( user, "username" ), "clintjhill", "Be sure username is set." );
      assert.equal( get( user, "email" ), "clint@foo.com", "Be sure email is set." );
      // assert.equal( get( user, "password"), null, "Be sure that password gets dumped." );
    });
  });

  // Find
  andThen(function() {
    store.findRecord( "parse-user", userIds[0].id ).then(function(user) {
      assert.ok( !get( user, "isCurrent" ), "User should not be current during a find." );
      assert.equal( get( user, "username" ), "clintjhill", "Be sure username is set." );
      assert.equal( get( user, "email" ), "clint@foo.com", "Be sure email is set." );
      // assert.equal( get( user, "password"), null, "Be sure that password gets dumped." );
    });
  });

  // Login
  andThen(function() {
    ParseUser.login( store, {username: "clintjhill", password: "loveyouall"} ).then( function( user ) {
      userIds[0].sessionToken = get( user, "sessionToken");

      assert.equal( get( user, "username" ), "clintjhill", "Be sure username is set." );
      assert.equal( get( user, "email" ), "clint@foo.com", "Be sure email is set." );
      // assert.equal( get( user, "password" ), null, "Be sure that password gets dumped." );
    });
  });

  // Me
  andThen(function() {
    adapter.set("sessionToken", userIds[0].sessionToken);

    ParseUser.me( store ).then( function( user ) {
      assert.equal( get( user, "username" ), "clintjhill", "Be sure username is set." );
      assert.equal( get( user, "email" ), "clint@foo.com", "Be sure email is set." );
      // assert.equal( get( user, "password" ), null, "Be sure that password gets dumped." );
    });
  });

  // Logout
  andThen(function() {
    ParseUser.logout( store ).then(function() {
      ParseUser.me( store ).catch( function( error ) {
        assert.ok(error, "An error must be returned.");
        assert.equal(error.code, 209, "Session token should be invalid now.");
      });
    });
  });

  // Update
  andThen(function() {
    ParseUser.login( store, {username: "clintjhill", password: "loveyouall"} ).then( function( user ) {

      // update allowed with the right session-token
      userIds[0].sessionToken = get( user, "sessionToken");
      adapter.set("sessionToken", userIds[0].sessionToken);

      user.set( "email", "other@foo.com" );
      assert.ok( get( user, "hasDirtyAttributes" ), "user has dirty attributes.");

      user.save().then(function(result) {
        assert.notOk( get( result, "hasDirtyAttributes" ), "user has not dirty attributes.");
        assert.equal( get( result, "email" ), "other@foo.com", "User was updated.");
      });
    });
  });
});


test("Signup with bad parameters", function(assert) {
  assert.expect(2);

  andThen(function() {
    ParseUser.signup( store, {
      username : "clintjhill",
      email    : "clint@foo.com"

    }).catch( function( error ) {
      assert.ok(error, "An error must be returned.");
      assert.equal(error.code, 201, "Password is required.");
    });
  });
});


test("Login with bad parameters", function(assert) {
  assert.expect(2);

  andThen(function() {
    ParseUser.login( store, {username: "clintjhill", password: "unknown"} ).catch( function( error ) {
      assert.ok(error, "An error must be returned.");
      assert.equal(error.code, 101, "Invalid username/password.");
    });
  });
});


test( "Subclassing Parse User", function( assert ) {
  assert.expect(2);

  ParseUser.reopen({
    nickname: DS.attr("string")
  });

  andThen(function() {
    ParseUser.signup( store, {
      username  : "clint",
      password  : "loveyouall",
      nickname  : "rick"

    }).then( function( user ) {
      userIds.push({
        id: get( user, "id"),
        sessionToken: get( user, "sessionToken"),
        username: "clint",
        password: "loveyouall"
      });

      assert.ok( get( user, "isLoaded" ) );
      assert.equal( get( user, "nickname" ), "rick", "Additional attributes are added." );
    });
  });
});


QUnit.skip("Reset password with bad parameters", function(assert) {
  assert.expect(2);

  andThen(function() {
    ParseUser.requestPasswordReset( store ).catch( function( error ) {
      assert.ok(error, "An error must be returned.");
      assert.equal(error.code, 204, "you must provide an email.");
    });
  });
});


QUnit.skip("Signup with Facebook", function( assert ) {
  assert.expect(6);

  var expirationDate = ( new Date() ).toISOString();

  andThen(function() {
    ParseUser.signup( store, {
      authData: {
        facebook: {
          access_token    : "some-fake-token",
          id              : "some-id",
          expiration_date : expirationDate
        }
      }

    }).then( function( user ) {
      userIds.push({
        id: get( user, "id"),
        sessionToken: get( user, "sessionToken")
      });

      assert.ok( !get( user, "isSaving" ), "user is not saving" );
      assert.ok( !get( user, "hasDirtyAttributes" ), "user is not dirty" );
      assert.notOk( Ember.isEmpty( userIds[0].id ), "Be sure objectId is set." );
      assert.equal( get( user, "password" ), null, "Be sure that password gets dumped." );
      assert.notOk( Ember.isEmpty( userIds[0].sessionToken ), "Make sure session token set." );
      assert.equal( get( user, "username" ), "foofoo-username", "Make sure username set." );
    });
  });
});
