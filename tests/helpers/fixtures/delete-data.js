import Ember from 'ember';

export default function deleteData(apiUrl, applicationId, restApiId, className, id) {
  var url = apiUrl + "/classes/" + className + "/" + id;

  return $.ajax({
    url: url,
    type: "DELETE",
    beforeSend: function(request) {
      request.setRequestHeader("X-Parse-Application-Id", applicationId);
      request.setRequestHeader("X-Parse-REST-API-Key", restApiId);
      request.setRequestHeader("Content-Type", "application/json");
    }
  });
}
