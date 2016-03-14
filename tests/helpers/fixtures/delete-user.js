import Ember from 'ember';

export default function deleteUser(apiUrl, applicationId, restApiId, userId, sessionToken) {
  var url = apiUrl + "/users/" + userId;

  return $.ajax({
    url: url,
    type: "DELETE",
    beforeSend: function(request) {
      request.setRequestHeader("X-Parse-Application-Id", applicationId);
      request.setRequestHeader("X-Parse-REST-API-Key", restApiId);
      request.setRequestHeader("X-Parse-Session-Token", sessionToken);
      request.setRequestHeader("Content-Type", "application/json");
    }
  });
}
