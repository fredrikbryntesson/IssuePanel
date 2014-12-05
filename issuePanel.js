var Settings = (function () {
    function Settings() {
    }
    Settings.prototype.saveForm = function () {
        var authorization = this.makeBasicAuthentication(document.forms['configure']['user'].value, document.forms['configure']['password'].value);
        this.saveSettings(document.forms['configure']['owner'].value, document.forms['configure']['repository'].value, authorization, document.forms['configure']['title'].value);
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
    function Label(color, name) {
        this.color = color;
        this.name = name;
    }
    Label.prototype.render = function () {
        return '<span style="background: #' + this.color + '">' + this.name + '</span>';
    };
    return Label;
})();
var Issue = (function () {
    function Issue(number, state, title, assignee, milestoneID, labels, url) {
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
    function Milestone(id, title, description, open_issues, closed_issues) {
        var _this = this;
        this.render = function (issues) {
            var result = '<li class="milestone">' + '<div class="progress">' + _this.renderProgress() + '</div>' + '<h3 class="title">' + _this.title + '</h3>' + '<p>' + _this.description + '</p>' + '<ul>';
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
                    _this.milestones = [];
                    for (var i = 0; i < data.length; i++) {
                        _this.milestones[i] = new Milestone(data[i].id, data[i].title, data[i].description, data[i].open_issues, data[i].closed_issues);
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
                                labels[j] = new Label(data[i].labels[j].color, data[i].labels[j].name);
                            }
                        }
                        var assignee = null;
                        if (data[i].assignee !== null) {
                            assignee = new Assignee(data[i].assignee.avatar_url, data[i].assignee.login);
                        }
                        _this.open[i] = new Issue(data[i].number, data[i].state, data[i].title, assignee, milestoneID, labels, data[i].html_url);
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
                                labels[j] = new Label(data[i].labels[j].color, data[i].labels[j].name);
                            }
                        }
                        var assignee = null;
                        if (data[i].assignee !== null) {
                            assignee = new Assignee(data[i].assignee.avatar_url, data[i].assignee.login);
                        }
                        _this.closed[i] = new Issue(data[i].number, data[i].state, data[i].title, assignee, milestoneID, labels, data[i].html_url);
                    }
                    _this.update(settings);
                }
            }, settings.owner, settings.repository, function (header) {
                setHeader(header);
                if (_this.closedETag !== null)
                    header.setRequestHeader('If-None-Match', _this.closedETag);
            }, true);
            //setTimeout(this.reload(settings, setHeader), 60000);
        };
        this.milestones = null;
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
    $('#open').click(exec);
    $('#openSettings').click(function () {
        document.getElementById("settings").style.visibility = "visible";
        return false;
    });
});
