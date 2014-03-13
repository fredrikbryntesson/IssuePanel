/// <reference path="jquery.d.ts" />
/// <reference path="jquery.base64.d.ts" />
function loadContent()
{
	var authentication = makeBasicAuthentication(document.forms['configure']['user'].value, document.forms['configure']['password'].value);
    loadData(
        document.forms['configure']['owner'].value,
        document.forms['configure']['repository'].value, header => header.setRequestHeader('Authorization', authentication)
        );
    console.log("form handled");
	return false;
}

function makeBasicAuthentication(user, password) {
  var tok = user + ':' + password;
  var hash = btoa(tok);
  return "Basic " + hash;
}
function loadData(owner, repository, setHeader) {
	var milestones = null;
	var milestonesETag = null;
	var open = null;
	var openETag = null;
	var closed = null;
	var closedETag = null;
	var update = function () {
		if (milestones !== null && open !== null && closed !== null)
		{
			var issues = open.concat(closed);
			var content = '<ul>';
			for (var i = 0; i < milestones.length; i++)
				content += renderMilestone(milestones[i], issues);
			content += '</ul>';
			$('#content')[0].innerHTML = content;
		}
	};
	var reload = function () {
		loadMilestones(
			function (data, status, request) {
				var eTag = request.getResponseHeader('ETag');
				if (milestonesETag != eTag)
				{
					milestonesETag = eTag;
					milestones = data;
					update();
				}
			}, owner, repository, function (header) { setHeader(header); if (milestonesETag !== null) header.setRequestHeader ('If-None-Match', milestonesETag); } );
		loadIssues(
			function (data, status, request) {
				var eTag = request.getResponseHeader('ETag');
				if (openETag != eTag)
				{
					openETag = eTag;
					open = data;
					update();
				}
			}, owner, repository, function (header) { setHeader(header); if (openETag !== null) header.setRequestHeader ('If-None-Match', openETag); } );
		loadIssues(
			function (data, status, request) {
				var eTag = request.getResponseHeader('ETag');
				if (closedETag != eTag)
				{
					closedETag = eTag;
					closed = data;
					update();
				}
			}, owner, repository, function (header) { setHeader(header); if (closedETag !== null) header.setRequestHeader ('If-None-Match', closedETag); }, true);
		setTimeout(reload, 60000);
	}
	reload();
	
}
function renderMilestone(milestone, issues)
{
	var result = '<li class="milestone">' +
	'<div class="progress">' + renderProgress(100.0 * milestone.closed_issues / (milestone.open_issues + milestone.closed_issues)) + '</div>' + 
	'<h3 class="title">' + milestone.title + '</h3>' +
	'<p>' + milestone.description + '</p>' +
	'<ul>';
	for (var i = 0; i < issues.length; i++)
		if (issues[i].milestone !== null && issues[i].milestone.id == milestone.id)
			result += renderIssue(issues[i]);
	result += '</ul></li>';
	return result;
}
function renderProgress(finished)
{
	return 	'<span class="progress-bar">' +
	'<span class="progress" style="width: ' + finished + '%" ></span>' + 
	'<span class="percent">' + Math.round(finished) + '%</span>' +
	'</span>';
}
function renderIssue(issue)
{
	return '<li id="issue_' + issue.number + '" class="issue ' + issue.state + '">' + 
	'<span class="number">#' + issue.number + '</span>' +
	'<h4 class="title">' + issue.title + 
	'</h4>' +
	//'<p>' + issue.body + '</p>' +
	'<div class="meta">' +
	'<span>' + (issue.assignee !== null ? ('<img src="' + issue.assignee.avatar_url + '"/>' + issue.assignee.login) : '') + '</span>' +
	renderLabels(issue.labels) +
	'</div></li>';
}
function renderLabels(labels)
{
	var result = '';
	if (labels !== null)
	{
		result += '<span class="labels">';
		for (var k = 0; k < labels.length; k++)
			result += '<span style="background: #' + labels[k].color + '">' + labels[k].name + '</span>';
		result += '</span>';
	}
	return result;
}
function loadMilestones (success, owner, repository, setHeader) {
	$.ajax({ 
		url: 'https://api.github.com/repos/' + owner + '/' + repository + '/milestones?per_page=100', 
		type: 'GET',
		dataType: 'json',
		beforeSend: setHeader,
		success: success,
        error: (jqHXR, textStatus, errorThrown) => {
            console.log(textStatus);
        }
	});
}
function loadIssues (success, owner, repository, setHeader, closed = false) {
	$.ajax({ 
        url: 'https://api.github.com/repos/' + owner + '/' + repository + '/issues?per_page=100' + (closed ? ';state=closed' : ''),
        type: 'GET',
        dataType: 'json',
        beforeSend: setHeader,
        success: success,
        error: (jqHXR, textStatus, errorThrown) => {
            console.log(textStatus);
        }
	});
}
$(document).ready(() => {
    $('#open').click(loadContent);
});