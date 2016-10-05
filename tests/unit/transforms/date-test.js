import Ember from "ember";
import DateTransform from "ember-parse-adapter-two/transforms/date";

var transform;

module( "Unit - transforms:date", {
  setup: function() {
    transform = DateTransform.create();
  },
  teardown: function() {
    Ember.run( transform, "destroy" );
  }
});

test( "Serializes", function( assert ) {
  var date = new Date( 2013, 11, 10 );
  var origIso = date.toISOString();
  var result = transform.serialize( date );

  assert.notOk( Ember.isEmpty(result), "get an object" );
  assert.equal( result.iso, origIso, "iso is rendered" );
  assert.equal( result.__type, "Date", "has the proper type" );
});

test( "Serializes null to null", function( assert ) {
  var result = transform.serialize( null );
  assert.ok( Ember.isEmpty(result), "Serialization of null is null" );
});

test( "Deserializes a string", function( assert ) {
  var result = transform.deserialize( "2013-11-10T05:23:12.497Z" );

  assert.notOk( Ember.isEmpty(result), "get an object" );
  assert.ok( result instanceof Date, "is a date" );
  assert.equal( result.getTime(), 1384060992497, "timestamp is correct" );
});

test( "Deserializes an object" , function( assert ) {
  var date = {
    __type: "Date",
    iso: "2013-11-10T05:23:12.497Z",
  };
  var result = transform.deserialize( date );

  assert.notOk( Ember.isEmpty(result), "get an object" );
  assert.ok( result instanceof Date, "is a date" );
  assert.equal( result.getTime(), 1384060992497, "timestamp is correct" );
});

test( "Deserializes null to null", function( assert ) {
  var result = transform.deserialize( null );
  assert.ok( Ember.isEmpty(result), "Deserialization of null is null" );
});
