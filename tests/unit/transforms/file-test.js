import Ember from "ember";
import FileTransform from "ember-parse-adapter-two/transforms/file";
import File from "ember-parse-adapter-two/file";

var transform;

module( "Unit - transforms:file", {
  setup: function() {
    transform = FileTransform.create();
  },
  teardown: function() {
    Ember.run( transform, "destroy" );
  }
});

test( "Serializes", function( assert ) {
  var file = File.create({
      name : "car",
      url  : "http://example.com/car.png"
    });
  var result = transform.serialize( file );

  assert.notOk( Ember.isEmpty(result), "get an object" );
  assert.equal( result.name, file.get( "name" ), "name is preserved" );
  assert.equal( result.url, file.get( "url" ), "url is preserved" );
  assert.equal( result.__type, "File", "has the proper type" );
});

test( "Serializes null to null", function( assert ) {
  var result = transform.serialize( null );
  assert.ok( Ember.isEmpty(result), "Serialization of null is null" );
});

test( "Deserializes", function( assert ) {
  var file = {
    name   : "Plane",
    url    : "http://example.com/plane.png",
    __type : "File"
  };
  var result = transform.deserialize( file );

  assert.notOk( Ember.isEmpty(result), "get an object" );
  assert.ok( result instanceof DS.Transform, "is a DS.Transform" );
  assert.equal( result.get( "name" ), file.name, "name is preserved" );
  assert.equal( result.get( "url" ), file.url, "url is preserved" );
});

test( "Deserializes null to null", function( assert ) {
  var result = transform.deserialize( null );
  assert.ok( Ember.isEmpty(result), "Deserialization of null is null" );
});
