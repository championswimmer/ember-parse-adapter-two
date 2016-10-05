import Ember from "ember";
import GeoPointTransform from "ember-parse-adapter-two/transforms/geopoint";
import GeoPoint from "ember-parse-adapter-two/geopoint";

var transform;

module( "Unit - transforms:geopoint", {
  setup: function() {
    transform = GeoPointTransform.create();
  },
  teardown: function() {
    Ember.run( transform, "destroy" );
  }
});

test( "Serializes", function( assert ) {
  var geoPoint = GeoPoint.create({
      latitude  : 4.53,
      longitude : 3.33
    });
  var result = transform.serialize( geoPoint );

  assert.notOk( Ember.isEmpty(result), "get an object" );
  assert.equal( result.latitude, geoPoint.get( "latitude" ), "latitude is preserved" );
  assert.equal( result.longitude, geoPoint.get( "longitude" ), "longitude is preserved" );
  assert.equal( result.__type, "GeoPoint", "has the proper type" );
});

test( "Serializes null to null", function( assert ) {
  var result = transform.serialize( null );
  assert.ok( Ember.isEmpty(result), "Serialization of null is null" );
});

test( "Deserializes", function( assert ) {
  var point = {
    latitude  : 3.43,
    longitude : 4.2,
    __type    : "GeoPoint"
  };
  var result = transform.deserialize( point );

  assert.notOk( Ember.isEmpty(result), "get an object" );
  assert.ok( result instanceof DS.Transform, "is a geo point" );
  assert.equal( result.get( "latitude" ), point.latitude, "latitude is preserved" );
  assert.equal( result.get( "longitude" ), point.longitude, "longitude is preserved" );
});

test( "Deserializes null to null", function( assert ) {
  var result = transform.deserialize( null );
  assert.ok( Ember.isEmpty(result), "Deserialization of null is null" );
});
