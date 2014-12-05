class Settings {
    public owner: string;
    public repository: string;
    public authorization: string;
    public title : string;
    saveForm()
    {
    	var authorization = this.makeBasicAuthentication(document.forms['configure']['user'].value, document.forms['configure']['password'].value);
    	this.saveSettings(
            document.forms['configure']['owner'].value,
            document.forms['configure']['repository'].value, 
            authorization,
            document.forms['configure']['title'].value
            );
        //loadContent();
        return false;
    }
    saveSettings(owner, repository, authorization, title = null)
    {
    	var settings = { owner : owner, repository : repository, authorization : authorization, title : title };
    	this.owner = owner;
    	this.repository = repository;
    	this.authorization = authorization;
    	this.title = title;
    	localStorage.setItem("IssuePanel.settings", JSON.stringify(settings)); 
    }
    makeBasicAuthentication(user, password) {
        var tok = user + ':' + password;
        var hash = btoa(tok);
    return "Basic " + hash;
}
    static load(): Settings
    {
    	return JSON.parse(localStorage.getItem("IssuePanel.settings")); 
    }
}

class Label {
    private color: string;
    private name: string;
    constructor(color: string, name: string) {
        this.color = color;
        this.name = name;
    }
    render(): string {
        return '<span style="background: #' + this.color + '">' + this.name + '</span>';
    }
}

class Issue {
    private number: number;
    private state: string;
    public title: string;
    private assignee: Assignee;
    private avatar_url: string;
    private login: string;
    private labels: Label[];
    public milestoneID: number
    constructor(number: number, state: string, title: string, assignee: Assignee, milestoneID: number, labels: Label[]) {
        this.number = number;
        this.state = state;
        this.title = title;
        this.assignee = assignee;
        this.milestoneID = milestoneID
        this.labels = labels;
    } 
    render = (): string  => {
        //  '<div onclick="alert('You clicked me !')">Click Me</div>'
        //  <a href="http://google.com">link</a>
    	var result  = '<li id="issue_' + this.number + '" class="issue ' + this.state + '">' +
    	'<span class="number">#' + this.number + '</span>' +
    	'<h4 class="title">' + this.title + 
    	'</h4>' +
    	//'<p>' + this.body + '</p>' +
    	'<div class="meta">' + 
    	'<span>' + (this.assignee !== null ? this.assignee.render() : '') + '</span>' +
    	this.renderLabels() +
    	'</div></li>';
    	return result;
    }
    private renderLabels(): string 
    {
    	var result = '';
    	if (this.labels !== null)
    	{
    		result += '<span class="labels">';
    		for (var k = 0; k < this.labels.length; k++) {
    			result += this.labels[k].render();
    		}
    		result += '</span>';
    	}
    	return result;
    }
    static loadIssues(success, owner, repository, setHeader, closed) {
         if (typeof closed === "undefined") { closed = false; }
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
    }
}

class Assignee {
	private avatar_url: string;
	private login: string;
	constructor(avatar_url: string, login: string) {
	    this.avatar_url = avatar_url;
	    this.login = login;
	}
	render(): string {
		return '<img src="' + this.avatar_url + '"/>' + this.login;
	}
}

class Milestone {
    public id: number;
    public title: string;
    private description: string;
    private open_issues: number;
    private closed_issues: number;
    public openIssues: Issue[];
    public closedIssues: Issue[];
    public data;
    
    constructor(id: number, title: string, description: string, open_issues: number, closed_issues: number) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.open_issues = open_issues;
        this.closed_issues = closed_issues;
    }
    get finished(): number {
        return 100.0 * this.closed_issues / (this.open_issues + this.closed_issues);
    }
    render = (issues: Issue[]): string => {
    	var result = '<li class="milestone">' + '<div class="progress">' + this.renderProgress() + '</div>' + '<h3 class="title">' + this.title + '</h3>' + '<p>' + this.description + '</p>' + '<ul>';
        for (var i = 0; i < issues.length; i++) {
            if (issues[i].milestoneID !== null && issues[i].milestoneID == this.id)
                result += issues[i].render();
        }
        result += '</ul></li>';
        return result;
    }
    private renderProgress(): string {
    	return 	'<span class="progress-bar">' +
    	'<span class="progress" style="width: ' + this.finished + '%" ></span>' + 
    	'<span class="percent">' + Math.round(this.finished) + '%</span>' +
    	'</span>';
    }
    static loadMilestones(success, owner, repository, setHeader) {
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
    }
}

class LoadData {
    private milestones: Milestone[];
    private milestonesETag: String;
    private open: Issue[];
    private openETag: String;
    private closed: Issue[];
    private closedETag: String;
    constructor() {
        this.milestones = null;
        this.milestonesETag = null
        this.open = null;
        this.openETag = null;
        this.closed = null;
        this.closedETag = null;
	}
	update = (settings: Settings) => {
        if (this.milestones !== null && this.open !== null && this.closed !== null) {
            var issues = this.open.concat(this.closed);
            var content = '<ul>';
            if (settings.title !== null && settings.title !== "") {
                content = '<header><h1>' + settings.title + '</h1></header>' + content;
                document.title = settings.title;
            }
            for (var i = 0; i < this.milestones.length; i++) {
                content += this.milestones[i].render(issues);
            }
            content += '</ul>';
            $('#content')[0].innerHTML = content;
        }
    }
    reload = (settings: Settings, setHeader) => {
        Milestone.loadMilestones((data, status, request) => {
            var eTag = request.getResponseHeader('ETag');
            if (this.milestonesETag != eTag) {
                this.milestonesETag = eTag;
                 this.milestones = [];
                for (var i = 0; i < data.length; i++) {
                    this.milestones[i] = new Milestone(data[i].id, data[i].title, data[i].description, data[i].open_issues, data[i].closed_issues);
                }
                this.update(settings);
            }
        }, settings.owner, settings.repository, (header) => {
             setHeader(header);
            if (this.milestonesETag !== null) 
                header.setRequestHeader('If-None-Match', this.milestonesETag);
        });
        Issue.loadIssues((data, status, request) => {
            var eTag = request.getResponseHeader('ETag');
            if (this.openETag != eTag) {
                this.openETag = eTag;
                this.open = [];
                for (var i = 0; i < data.length; i++) {
                    var milestoneID = null;
                    if (data[i].milestone !== null) {
                        milestoneID = data[i].milestone.id;
                    }
                    var labels = [];
                    if (data[i].labels !== null) {
                        for (var j = 0; j < data[i].labels.length; j++) {
                            labels[j] = new Label(data[i].labels[j].color,data[i].labels[j].name);
                        }
                    }
                    var assignee = null;
                    if (data[i].assignee !== null) {
                        assignee = new Assignee(data[i].assignee.avatar_url,data[i].assignee.login);
                    }
                    this.open[i] = new Issue(data[i].number, data[i].state, data[i].title, assignee, milestoneID, labels);
                }
                this.update(settings);
            }
        }, settings.owner, settings.repository, (header) => {
            setHeader(header);
            if (this.openETag !== null)
                header.setRequestHeader('If-None-Match', this.openETag);
        },false);
         Issue.loadIssues((data, status, request) => {
            var eTag = request.getResponseHeader('ETag');

            if (this.closedETag != eTag) {
                this.closedETag = eTag;
                this.closed = [];
                for (var i = 0; i < data.length; i++) {
                    var milestoneID = null;
                    if (data[i].milestone !== null) {
                        milestoneID = data[i].milestone.id;
                    }
                    var labels = [];
                    if (data[i].labels !== null) {
                        for (var j = 0; j < data[i].labels.length; j++) {
                            labels[j] = new Label(data[i].labels[j].color,data[i].labels[j].name);
                        }
                    }
                    var assignee = null;
                    if (data[i].assignee !== null) {
                        assignee = new Assignee(data[i].assignee.avatar_url,data[i].assignee.login);
                    }
                    this.closed[i] = new Issue(data[i].number, data[i].state, data[i].title, assignee, milestoneID, labels);
                }
                this.update(settings);
            }
        }, settings.owner, settings.repository, (header) => {
            setHeader(header);
            if (this.closedETag !== null)
            header.setRequestHeader('If-None-Match', this.closedETag);
        }, true);
        //setTimeout(this.reload(settings, setHeader), 60000);
    }
    loadContent(settings: Settings) {
        var result;
        if (result = settings !== null) {
            console.log("Load Content Settings: " + JSON.stringify(settings));
            this.reload(settings,function (header) {
                return header.setRequestHeader('Authorization', settings.authorization);
            });
            document.getElementById("settings").style.visibility = "hidden";
        }
        return result; 
    }
}

function exec() {
    var settings = new Settings();
    settings.saveForm()
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