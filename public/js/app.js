'use strict';

/* App Module */

var twitterApp = angular.module('twitterApp', [
  'ngRoute',
  'ui.bootstrap',
  'twitterControllers'
]);

twitterApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'partials/company-list.html',
        controller: 'CompanyListCtrl'
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);