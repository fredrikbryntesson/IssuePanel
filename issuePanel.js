$(document).ready(function(){
	$('#open').click(loadContent);
});
function loadContent()
{
	var authentication = makeBasicAuthentication(document.forms['configure']['user'].value, document.forms['configure']['password'].value);
	loadData(
		document.forms['configure']['owner'].value, 
		document.forms['configure']['repository'].value,  
		function (header) { 
			header.setRequestHeader ('Authorization', authentication); 
		}
	)
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
		if (milestones != null && open != null && closed != null)
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
				eTag = request.getResponseHeader('ETag');
				if (milestonesETag != eTag)
				{
					milestonesETag = eTag;
					milestones = data;
					update();
				}
			}, owner, repository, function (header) { setHeader(header); if (milestonesETag != null) header.setRequestHeader ('If-None-Match', milestonesETag); } );
		loadIssues(
			function (data, status, request) {
				eTag = request.getResponseHeader('ETag');
				if (openETag != eTag)
				{
					openETag = eTag;
					open = data;
					update();
				}
			}, owner, repository, function (header) { setHeader(header); if (openETag != null) header.setRequestHeader ('If-None-Match', openETag); } );
		loadIssues(
			function (data, status, request) {
				eTag = request.getResponseHeader('ETag');
				if (closedETag != eTag)
				{
					closedETag = eTag;
					closed = data;
					update();
				}
			}, owner, repository, function (header) { setHeader(header); if (closedETag != null) header.setRequestHeader ('If-None-Match', closedETag); }, true);
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
		if (issues[i].milestone.id == milestone.id)
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
	renderLabels(issue.labels) +
	'</h4>' +
	// '<dl class="meta">' + 
	// (issue.due_on != null ? '<dt>due</dt><dl><time datetime="' + issue.due_on + '">' + issue.due_on + '</time></dl>' : '') +
	// '<dt>created</dt><dl><time datetime="' + issue.created_at + '">' + issue.created_at + '</time> by ' + issue.user.login + '</dl>' +
	// '<dt>updated</dt><dl><time datetime="' + issue.updated_at + '">' + issue.updated_at + '</time></dl>' +
	// (issue.closed_at != null ? '<dt>closed</dt><dl><time datetime="' + issue.closed_at + '">' + issue.due_on + '</time></dl>' : '') +
	// '</dl>';
	'<p>' + issue.body + '</p>' +
	'</li>';
}
function renderLabels(labels)
{
	var result = '';
	if (labels != null)
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
		url: 'https://api.github.com/repos/' + owner + '/' + repository + '/milestones', 
		type: 'GET',
		dataType: 'json',
		beforeSend: setHeader,
		success: success
	});
}
function loadIssues (success, owner, repository, setHeader, closed = false) {
	$.ajax({ 
		url: 'https://api.github.com/repos/' + owner + '/' + repository + '/issues' + (closed ? '?state=closed' : ''), 
		type: 'GET',
		dataType: 'json',
		beforeSend: setHeader,
		success: success
	});
}
