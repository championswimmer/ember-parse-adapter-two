import Ember from 'ember';
import Application from '../../app';
import config from '../../config/environment';

export default function startApp(attrs) {
  let application;

  let attributes = Ember.merge(
    {
      parseUrl        : 'http://localhost:1337',
      parseNamespace  : 'parse',
      applicationId   : '6ZNbAMXjYcg8BLakQ8AVyFWyfA6cTWwPwLb2Gzii',
      restApiId       : 'E2gCZw7WFgz3jfXhxjz9YnconZrbkTDgCUpLFQqy'
    },
  config.APP);
  attributes = Ember.merge(attributes, attrs); // use defaults, but you can override;

  Ember.run(() => {
    application = Application.create(attributes);
    application.setupForTesting();
    application.injectTestHelpers();
  });

  return application;
}
