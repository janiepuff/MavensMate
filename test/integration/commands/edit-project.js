'use strict';

var helper        = require('../../test-helper');
var chai          = require('chai');
var path          = require('path');
var should        = chai.should();
var fs            = require('fs-extra');

chai.use(require('chai-fs'));

describe('mavensmate edit-project', function(){

  var project;
  var testClient;

  before(function(done) {
    this.timeout(120000);
    helper.unlinkEditor();
    testClient = helper.createClient('unittest');
    helper.putTestProjectInTestWorkspace(testClient, 'edit-project');
    helper.addProject(testClient, 'edit-project')
      .then(function(proj) {
        project = proj;
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  after(function(done) {
    helper.cleanUpTestProject('edit-project')
    done();
  });

  it('should edit project contents', function(done) {
    this.timeout(120000);

    testClient.executeCommand({
        name: 'edit-project',
        body: { package: { CustomObject: 'Account' } }
      })
      .then(function(response) {
        should.not.equal(response, null);

        var accountPath = path.join(testClient.getProject().path, 'src', 'objects', 'Account.object');
        fs.existsSync(accountPath).should.equal(true);

        var classPath = path.join(testClient.getProject().path, 'src', 'classes');
        var triggerPath = path.join(testClient.getProject().path, 'src', 'triggers');
        fs.existsSync(classPath).should.equal(false);
        fs.existsSync(triggerPath).should.equal(false);

        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  it('should fail to update project creds because of invalid login', function(done) {
    this.timeout(120000);
    testClient.executeCommand({
        name: 'update-creds',
        body: { username: 'thiswontwork@foo.com', password: 'foobarbatbam', loginUrl: 'https://test.salesforce.com' }
      })
      .catch(function(err) {
        err.message.should.contain('INVALID_LOGIN: Invalid username, password, security token; or user locked out.');
        done();
      });
  });

  it('should update project creds', function(done) {
    this.timeout(120000);
    var creds = helper.getTestCreds();
    testClient.executeCommand({
        name: 'update-creds',
        body: {
          username: creds.username,
          password: creds.password
        }
      })
      .then(function(response) {
        response.message.should.equal('Credentials updated successfully!');
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

});
