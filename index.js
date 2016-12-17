/* jshint node: true */
'use strict';

var Promise    = require('ember-cli/lib/ext/promise');
var DeployPluginBase = require('ember-cli-deploy-plugin');

function airbrakeConfig(context) {
  var env = context.config.build.environment;
  var config = context.project.config(env);

  return config.airbrake || {};
}

module.exports = {
  name: 'ember-cli-deploy-airbrake',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,

      // If ember-cli-airbrake is installed we can use the config
      defaultConfig: {
        projectId: function(context) {
          return airbrakeConfig(context).projectId;
        },
        projectKey: function(context) {
          return airbrakeConfig(context).projectKey;
        }
      },

      requiredConfig: ['projectId', 'projectKey'],

      didActivate: function(context) {
        var airbrake = require('airbrake').createClient(
          this.readConfig('projectId'),
          this.readConfig('projectKey')
        );

        var env = context.deployTarget;
        var revisionData = context.revisionData;
        var revisionKey = revisionData && revisionData.activatedRevisionKey;

        var deployment = {
          env: env,
          rev: revisionKey,
          repo: null
        };

        var plugin = this;
        var trackDeployment = Promise.denodeify(
          airbrake.trackDeployment.bind(airbrake)
        );

        return trackDeployment(deployment).then(function(params) {
          plugin.log(
            'Notified Airbrake about ' +
            params.env + ' deployment of revision ' + params.rev
          );
        }, function(error) {
          return Promise.reject(error);
        });
      }
    });

    return new DeployPlugin();
  }
};
