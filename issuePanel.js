/// <reference path="jquery.d.ts" />
var Settings = (function () {
    function Settings() {
    }
    Settings.prototype.saveForm = function () {
        var url = document.location.toString();
        var result = this.checkURL(url);
        if (result == "" || result == url) {
            var authorization = this.makeBasicAuthentication(document.forms['configure']['user'].value, document.forms['configure']['password'].value);
            this.saveSettings(document.forms['configure']['owner'].value, document.forms['configure']['repository'].value, authorization, document.forms['configure']['title'].value);
        }
        else {
            this.saveSettingsURL(url);
        }
        //loadContent();
        return false;
    };
    Settings.prototype.saveSettings = function (owner, repository, authorization, title) {
        if (title === void 0) { title = null; }
        var settings = { owner: owner, repository: repository, authorization: authorization, title: title };
        this.owner = owner;
        this.repository = repository;
        this.authorization = authorization;
        this.title = title;
        localStorage.setItem("IssuePanel.settings", JSON.stringify(settings));
    };
    Settings.prototype.checkURL = function (url) {
        var queryStart = url.indexOf("?") + 1;
        var queryEnd = url.indexOf("#") + 1 || url.length + 1;
        var query = url.slice(queryStart, queryEnd - 1);
        return query;
    };
    Settings.prototype.saveSettingsURL = function (url) {
        var queryStart = url.indexOf("?") + 1;
        var queryEnd = url.indexOf("#") + 1 || url.length + 1;
        var query = url.slice(queryStart, queryEnd - 1);
        var pairs = query.replace(/\+/g, " ").split("&");
        this.title = pairs[0];
        this.owner = pairs[1];
        this.repository = pairs[2];
        this.authorization = pairs[3];
        var settings = { owner: this.owner, repository: this.repository, authorization: this.authorization, title: this.title };
        localStorage.setItem("IssuePanel.settings", JSON.stringify(settings));
    };
    Settings.prototype.makeBasicAuthentication = function (user, password) {
        var tok = user + ':' + password;
        var hash = btoa(tok);
        return "Basic " + hash;
    };
    Settings.load = function () {
        return JSON.parse(localStorage.getItem("IssuePanel.settings"));
    };
    return Settings;
})();
var Label = (function () {
    function Label(color, name, owner, repository) {
        this.color = color;
        this.name = name;
        this.owner = owner;
        this.repository = repository;
    }
    Label.prototype.render = function () {
        var background = '';
        var asDecimal = parseInt(this.color, 16);
        if (asDecimal > 7814560) {
            //if (asDecimal > 38911) {
            background = 'lightBackground';
        }
        else
            background = 'darkBackground';
        var html_url = 'https://github.com/' + this.owner + '/' + this.repository + '/labels/' + this.name + '/';
        return '<span  onclick="window.open(\'' + html_url + '\').focus()" style="background: #' + this.color + '" span< class="' + background + '">' + this.name + '</span>';
        //return '<span  onclick="window.open(\'' + html_url+'\').focus()" style="background: #' + this.color + '">' + this.name + '</span>';
    };
    return Label;
})();
var Issue = (function () {
    function Issue(number, state, title, assignee, milestoneID, labels, url, body) {
        var _this = this;
        this.render = function () {
            var result = '<li id="issue_' + _this.number + '" class="issue ' + _this.state + '" onclick="window.open(\'' + _this.html_url + ',_blank\').focus()">' + '<span class="number">#' + _this.number + '</span>' + '<h4 class="title">' + _this.title + '</h4>' + '<div class="meta">' + '<span>' + (_this.assignee !== null ? _this.assignee.render() : '') + '</span>' + _this.renderLabels() + '</div></li>';
            return result;
        };
        this.number = number;
        this.state = state;
        this.title = title;
        this.assignee = assignee;
        this.milestoneID = milestoneID;
        this.labels = labels;
        this.html_url = url;
        this.body = body;
    }
    Issue.prototype.renderLabels = function () {
        var result = '';
        if (this.labels !== null) {
            result += '<span class="labels">';
            for (var k = 0; k < this.labels.length; k++) {
                result += this.labels[k].render();
            }
            result += '</span>';
        }
        return result;
    };
    Issue.loadIssues = function (success, owner, repository, setHeader, closed) {
        if (typeof closed === "undefined") {
            closed = false;
        }
        $.ajax({
            url: 'https://api.github.com/repos/' + owner + '/' + repository + '/issues?per_page=100' + (closed ? ';state=closed' : ''),
            type: 'GET',
            dataType: 'json',
            beforeSend: setHeader,
            success: success,
            error: function (jqHXR, textStatus, errorThrown) {
                console.log("Error loading issues.");
                document.getElementById("settings").style.visibility = "visible";
            }
        });
    };
    return Issue;
})();
var Assignee = (function () {
    function Assignee(avatar_url, login) {
        this.avatar_url = avatar_url;
        this.login = login;
    }
    Assignee.prototype.render = function () {
        return '<img src="' + this.avatar_url + '"/>' + this.login;
    };
    return Assignee;
})();
var Milestone = (function () {
    function Milestone(id, title, description, open_issues, closed_issues, owner, repository) {
        var _this = this;
        this.render = function (issues) {
            var html_url = 'https://github.com/' + _this.owner + '/' + _this.repository + '/milestones/' + _this.title;
            var result = '<li class="milestone">' + '<div class="progress">' + _this.renderProgress() + '</div>' + '<h3 class="title" onclick="window.open(\'' + html_url + '\').focus()">' + _this.title + '</h3>' + '<p>' + _this.description + '</p>' + '<ul>';
            for (var i = 0; i < issues.length; i++) {
                if (issues[i].milestoneID !== null && issues[i].milestoneID == _this.id)
                    result += issues[i].render();
            }
            result += '</ul></li>';
            return result;
        };
        this.id = id;
        this.title = title;
        this.description = description;
        this.open_issues = open_issues;
        this.closed_issues = closed_issues;
        this.owner = owner;
        this.repository = repository;
    }
    Object.defineProperty(Milestone.prototype, "finished", {
        get: function () {
            return 100.0 * this.closed_issues / (this.open_issues + this.closed_issues);
        },
        enumerable: true,
        configurable: true
    });
    Milestone.prototype.renderProgress = function () {
        return '<span class="progress-bar">' + '<span class="progress" style="width: ' + this.finished + '%" ></span>' + '<span class="percent">' + Math.round(this.finished) + '%</span>' + '</span>';
    };
    Milestone.loadMilestones = function (success, owner, repository, setHeader) {
        $.ajax({
            url: 'https://api.github.com/repos/' + owner + '/' + repository + '/milestones?per_page=100',
            type: 'GET',
            dataType: 'json',
            beforeSend: setHeader,
            success: success,
            error: function (jqHXR, textStatus, errorThrown) {
                console.log("Error loading milestones.");
                document.getElementById("settings").style.visibility = "visible";
            }
        });
    };
    return Milestone;
})();
var LoadData = (function () {
    function LoadData() {
        var _this = this;
        this.update = function (settings) {
            if (_this.milestones !== null && _this.open !== null && _this.closed !== null) {
                var issues = _this.open.concat(_this.closed);
                var content = '<ul>';
                if (settings.title !== null && settings.title !== "") {
                    content = '<header><h1>' + settings.title + '</h1></header>' + content;
                    document.title = settings.title;
                }
                for (var i = 0; i < _this.milestones.length; i++) {
                    content += _this.milestones[i].render(issues);
                }
                content += '</ul>';
                $('#content')[0].innerHTML = content;
            }
        };
        this.reload = function (settings, setHeader) {
            Milestone.loadMilestones(function (data, status, request) {
                var eTag = request.getResponseHeader('ETag');
                if (_this.milestonesETag != eTag) {
                    _this.milestonesETag = eTag;
                    for (var i = 0; i < data.length; i++) {
                        _this.milestones[i] = new Milestone(data[i].id, data[i].title, data[i].description, data[i].open_issues, data[i].closed_issues, settings.owner, settings.repository);
                    }
                    _this.update(settings);
                }
            }, settings.owner, settings.repository, function (header) {
                setHeader(header);
                if (_this.milestonesETag !== null)
                    header.setRequestHeader('If-None-Match', _this.milestonesETag);
            });
            Issue.loadIssues(function (data, status, request) {
                var eTag = request.getResponseHeader('ETag');
                if (_this.openETag != eTag) {
                    _this.openETag = eTag;
                    _this.open = [];
                    for (var i = 0; i < data.length; i++) {
                        var milestoneID = null;
                        if (data[i].milestone !== null) {
                            milestoneID = data[i].milestone.id;
                        }
                        var labels = [];
                        if (data[i].labels !== null) {
                            for (var j = 0; j < data[i].labels.length; j++) {
                                labels[j] = new Label(data[i].labels[j].color, data[i].labels[j].name, settings.owner, settings.repository);
                            }
                        }
                        var assignee = null;
                        if (data[i].assignee !== null) {
                            assignee = new Assignee(data[i].assignee.avatar_url, data[i].assignee.login);
                        }
                        _this.open[i] = new Issue(data[i].number, data[i].state, data[i].title, assignee, milestoneID, labels, data[i].html_url, data[i].body);
                    }
                    _this.update(settings);
                }
            }, settings.owner, settings.repository, function (header) {
                setHeader(header);
                if (_this.openETag !== null)
                    header.setRequestHeader('If-None-Match', _this.openETag);
            }, false);
            Issue.loadIssues(function (data, status, request) {
                var eTag = request.getResponseHeader('ETag');
                if (_this.closedETag != eTag) {
                    _this.closedETag = eTag;
                    _this.closed = [];
                    for (var i = 0; i < data.length; i++) {
                        var milestoneID = null;
                        if (data[i].milestone !== null) {
                            milestoneID = data[i].milestone.id;
                        }
                        var labels = [];
                        if (data[i].labels !== null) {
                            for (var j = 0; j < data[i].labels.length; j++) {
                                labels[j] = new Label(data[i].labels[j].color, data[i].labels[j].name, settings.owner, settings.repository);
                            }
                        }
                        var assignee = null;
                        if (data[i].assignee !== null) {
                            assignee = new Assignee(data[i].assignee.avatar_url, data[i].assignee.login);
                        }
                        _this.closed[i] = new Issue(data[i].number, data[i].state, data[i].title, assignee, milestoneID, labels, data[i].html_url, data[i].body);
                    }
                    _this.update(settings);
                }
            }, settings.owner, settings.repository, function (header) {
                setHeader(header);
                if (_this.closedETag !== null)
                    header.setRequestHeader('If-None-Match', _this.closedETag);
            }, true);
            setTimeout(_this.reload, 60000, settings, setHeader);
        };
        //this.milestones = null;
        this.milestones = [];
        this.milestonesETag = null;
        this.open = null;
        this.openETag = null;
        this.closed = null;
        this.closedETag = null;
    }
    LoadData.prototype.loadContent = function (settings) {
        var result;
        if (result = settings !== null) {
            console.log("Load Content Settings: " + JSON.stringify(settings));
            this.reload(settings, function (header) {
                return header.setRequestHeader('Authorization', settings.authorization);
            });
            document.getElementById("settings").style.visibility = "hidden";
        }
        return result;
    };
    return LoadData;
})();
function exec() {
    var settings = new Settings();
    settings.saveForm();
    var loader = new LoadData();
    loader.loadContent(settings);
    return false;
}
$(document).ready(function () {
    exec();
    $('#open').click(exec);
    $('#openSettings').click(function () {
        document.getElementById("settings").style.visibility = "visible";
        return false;
    });
});
