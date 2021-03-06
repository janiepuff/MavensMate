/**
 * @file Create a new local project/opens new project UI
 * @author Joseph Ferraro <@joeferraro>
 */

'use strict';

var Promise           = require('bluebird');
var util              = require('../../util').instance;
var Project           = require('../../project');
var BaseCommand       = require('../../command');
var SalesforceClient  = require('../../sfdc-client');
var inherits          = require('inherits');
var logger            = require('winston');
var EditorService     = require('../../editor');

function Command() {
  Command.super_.call(this, Array.prototype.slice.call(arguments, 0));
}

inherits(Command, BaseCommand);

Command.prototype.execute = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    if (self.isUICommand()) {
      var editorService = new EditorService(self.client, self.editor);
      editorService.launchUI('new-project-from-existing-directory', { directory: self.payload.args.directory })
        .then(function() {
          resolve('Success');
        })
        .catch(function(error) {
          reject(error);
        });
    } else {
      if (!self.payload.username || !self.payload.password || !self.payload.name) {
        return reject(new Error('Please specify username, password, and project name'));
      }

      var newProject;
      var sfdcClient = new SalesforceClient(self.payload);
      sfdcClient.initialize()
        .then(function() {
          newProject = new Project(self.payload);
          newProject.sfdcClient = sfdcClient;
          return newProject.initialize(true, true);
        })
        .then(function() {
          logger.debug('New project written to disk ...');
          logger.debug('attempting to open in editor');
          if (self.editor) {
            var editorService = new EditorService(self.client, self.editor);
            return editorService.open(newProject.path);
          } else {
            return resolve('MavensMate project created successfully');
          }
        })
        .then(function() {
          resolve('MavensMate project created successfully');
        })
        .catch(function(error) {
          logger.debug('Could not create project: ');
          logger.debug(error.stack);
          reject(error);
        })
        .done();
    }
  });
};

exports.command = Command;
exports.addSubCommand = function(client) {
  client.program
    .command('new-project-from-existing-directory')
    .option('--ui', 'Launches the default UI for the selected command.')
    .option('-d, --directory [directory]', 'Directory to create new mavensmate project from')
    .description('Creates a new MavensMate project from an existing directory')
    .action(function(){
      // if user has included the ui flag, launch the ui
      // else read STDIN
      if (this.ui) {
        client.executeCommand({
          name: this._name,
          body: { args: { ui: true, directory: this.directory } }
        });
      } else {
        var self = this;
        util.getPayload()
          .then(function(payload) {
            client.executeCommand({
              name: self._name,
              body: payload,
              editor: self.parent.editor
            });
          });
      }
    });
};
