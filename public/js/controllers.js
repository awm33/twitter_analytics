'use strict';

/* Controllers */

var twitterControllers = angular.module('twitterControllers', []);

twitterControllers.controller('CompanyListCtrl', ['$scope','$http',
  function($scope, $http) {
    $scope.orderProp = 'company';

    $http
    .get('/companies')
    .success(function (companies) {
      $scope.companies = companies;
    })
    .error(function (err) {
      console.log(err);
    })
  }]);

twitterControllers.controller('CompanyHandlesCtrl', ['$scope', '$http',
  function($scope, $http) {
   $scope.isCollapsed = true;

   $scope.handlesBtn = function (id) {
    $scope.isCollapsed = !$scope.isCollapsed

    if (!$scope.isCollapsed) {
      $http
      .get('/companies/' + id + '/handles')
      .success(function (handles) {
        handles.sort(function (a, b) {
          if (a.score < b.score)
            return 1;
          if (a.score > b.score)
            return -1;
          return 0;
        });

        $scope.handles = handles;
      })
      .error(function (err) {
        console.log(err);
      });
    }
   }
}]);