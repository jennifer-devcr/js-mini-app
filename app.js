"use strict";

/**
 * USER LIST DEFINITION
 * @param settings: Object.
 *    -list: Array, contains users objects (Optional).
 *    -totalElemID: String, ID of DOM element to display total items (Optional).
 *    -listElemID: String, ID of DOM element hosting the list of users (Required).
 * @constructor
 */
function UserList(settings) {
    this.list = settings.list || [];
    this.totalElemID = settings.totalElemID;
    this._addUserHandlers = [];
    this._deleteUserHandlers = [];

    if (settings.listElemID && settings.listElemID.length > 0) {
        this.listElemID = settings.listElemID;
    } else {
        throw "UserList: DOM Element ID required.";
    }
}


UserList.prototype = {
    /**
     * Subscribes Add User event
     * @param fn: Function
     */
    onAddUser: function (fn) {
        if (fn) this._addUserHandlers.push(fn);
    },

    /**
     * Subscribes Delete User event
     * @param fn: Function
     */
    onDeleteUser: function (fn) {
        if (fn) this._deleteUserHandlers.push(fn);
    },

    /**
     * Adds new user and trigger "add" event
     * @param user: Object
     * @param context: Function context for "this"
     */
    addUser: function (user, context) {
        if (user) {
            // Checking ID
            if (!user.id) user.id = (user.name || '') + new Date().getTime();

            this.list.push(user);
            this.updateView();

            // Triggering events
            var scope = context || this;
            this._addUserHandlers.forEach(function (event) {
                event.call(scope, user);
            });
        }
    },

    /**
     * Deletes user by ID
     * @param uid: String, User ID.
     * @param context: Function context for "this"
     */
    deleteUser: function (uid, context) {
        if (uid) {
            for (var i = this.list.length - 1; i >= 0; i--) {
                if (uid === this.list[i].id.toString())
                    this.list.splice(i, 1);
            }

            this.updateView();

            // Triggering events
            var scope = context || this;
            this._deleteUserHandlers.forEach(function (event) {
                event.call(scope, uid);
            });
        }
    },

    /**
     * Updates DOM
     */
    updateView: function () {
        if (this.listElemID) {
            var hostElem = document.getElementById(this.listElemID),
                totalElem = document.getElementById(this.totalElemID),
                scope = this;

            totalElem.innerHTML = this.list.length;

            /**
             * Emptying list container
             * RemoveChild is much faster than innerHTML = ''
             */
            while (hostElem.firstChild) hostElem.removeChild(hostElem.firstChild);

            if (this.list.length > 0) {
                // Adding item's elements to DOM
                this.list.forEach(function (item) {
                    var row = document.createElement('div'),
                        desc = item.name || '',
                        posts = item.posts ? item.posts.length : 0;

                    desc += ' - (' + posts + ' post';
                    desc += posts === 1 ? ')' : 's)';

                    row.className = 'item';
                    row.innerHTML = '<p class="desc">' + desc + '</p>' +
                        '<button type="button" class="btn btn-delete" uid="' + item.id + '">Delete</button>' +
                        '<a href="details.html?uid=' + item.id + '" class="btn btn-details">Details</a>';

                    hostElem.appendChild(row);
                });

                var btns = hostElem.getElementsByClassName('btn-delete');

                for (var i = 0, bLength = btns.length; i < bLength; i++) {
                    btns[i].onclick = function () {
                        scope.deleteUser(this.getAttribute('uid'));
                    };
                }

            } else {
                hostElem.innerHTML = '<p class="message">There are no users.</p>';
            }

        }
    }
};



/** APP CORE: Singleton pattern **/
var app = (function () {

    // Init the app
    function init(loadView) {
        if (!localStorage.userList) {
            getUsersData(loadView);

        } else {
            var users = JSON.parse(localStorage.userList);
            loadView(users);
        }
    }

    /**
     * Gets value of a parameter in the URL
     * @param paramName: String, Parameter name to get from the URL.
     **/
    function getParameter(paramName) {
        var params = window.location.search.substr(1).split('&');

        for (var i = 0; i < params.length; i++) {
            var p = params[i].split('=');

            if (p[i] == paramName) {
                return decodeURIComponent(p[1]);
            }
        }

        return false;
    }

    /**
     * Makes request to API
     * @param method: String, specify the type of request: GET, PULL, PUSH, etc. (Mandatory)
     * @param url: String, API url. (Mandatory)
     * @param success: Function, callback when request is successful. (Optional)
     * @param fail: Function, callback when request has failed. (Optional)
     */
    function request(method, url, success, fail) {
        if (method && method.length > 0 && url && url.length > 0) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    if (success) success(JSON.parse(xhr.responseText));
                } else {
                    if (fail) fail(xhr.statusText);
                }
            };
            xhr.send();
        }
    }

    /**
     * Gets and maps users data
     */
    function getUsersData(callback) {
        request('GET', 'http://jsonplaceholder.typicode.com/users', function (users) {
            if (users) {
                request('GET', 'http://jsonplaceholder.typicode.com/posts', function (posts) {
                    users.forEach(function (u) {
                        u.posts = [];

                        for (var i = 0, pLength = posts.length; i < pLength; i++) {
                            var p = posts[i];
                            if (p.userId === u.id) u.posts.push(p);
                        }
                    });

                    localStorage.userList = JSON.stringify(users);
                    if (callback) callback(users);

                }, function () {
                    localStorage.userList = JSON.stringify(users);
                    if (callback) callback(users);
                });
            }
        });
    }

    return {
        appInit: init,
        getUsersData: getUsersData,
        getParameter: getParameter,
        request: request
    };
})();


/** LIST VIEW **/
var listView = (function () {

    /**
     * Loads list view
     * @param users: Array of objects.
     */
    function loadView(users) {
        var txtNewUser = document.getElementById('txt-new-user'),
            userList = new UserList({
                list: users,
                totalElemID: 'total-users',
                listElemID: 'user-list'
            });

        // Subscribing Add User Event
        userList.onAddUser(function () {
            // After adding we clean the field
            txtNewUser.value = '';
            /**
             * Event handler (observer) passes UserList's scope to this function, as a result we can use: this.list
             * */
            localStorage.userList = JSON.stringify(this.list);
        });

        // Subscribing Delete User Event
        userList.onDeleteUser(function () {
            /**
             * Event handler (observer) passes UserList's scope to this function, as a result we can use: this.list
             * */
            localStorage.userList = JSON.stringify(this.list);
        });

        txtNewUser.onkeypress = function (e) {
            if (e.keyCode == 13) {
                userList.addUser({
                    name: txtNewUser.value
                });
            }
        };

        document.getElementById('btn-add-user').onclick = function () {
            userList.addUser({
                name: txtNewUser.value
            });
        };

        document.getElementById('btn-reset-list').onclick = function () {
            delete localStorage.userList;
            app.getUsersData(loadView);
        };

        userList.updateView();
    }

    return {
        loadView: loadView
    };
})();


/** DETAILS VIEW **/
var detailsView = (function () {

    /**
     * Loads detail view
     * @param users: Array of objects.
     */
    function loadDetailsView(users) {
        var user,
            uname = '',
            nameElem = document.getElementById('user-name'),
            postsElem = document.getElementById('user-posts'),
            noPostMsg = '<p class="message">There are no posts.</p>';

        // Searching user
        for (var i = 0, uLength = users.length; i < uLength; i++) {
            var u = users[i];
            if (u.id.toString() === detailsView.uid) user = u;
        }

        if (user) {
            if (user.name) uname = user.name;
            if (user.username) uname += ' (' + user.username + ')';
            nameElem.innerHTML = uname;

            /**
             * Emptying posts container
             * RemoveChild is much faster than innerHTML = ''
             */
            while (postsElem.firstChild) postsElem.removeChild(postsElem.firstChild);

            if (user.posts) {
                // Adding posts elements to DOM
                user.posts.forEach(function (post) {
                    var row = document.createElement('div');
                    row.className = 'post';
                    row.innerHTML = '<p class="id">' + (post.id || '') + '.</p>' +
                        '<p class="title">' + (post.title || '') + '</p>';
                    postsElem.appendChild(row);
                });

            } else {
                postsElem.innerHTML = noPostMsg;
            }

        } else {
            postsElem.innerHTML = noPostMsg;
            nameElem.innerHTML = 'User not found.';
        }
    }

    // Init view
    function init() {
        if (detailsView.uid) {
            app.appInit(loadDetailsView);
        }
    }

    return {
        uid: app.getParameter('uid'),
        init: init
    };
})();