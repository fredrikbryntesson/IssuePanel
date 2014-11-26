class Milestone {
    private id: number;
    private title: string;
    private description: string;
    private open_issues: number;
    private closed_issues: number;
    
    get finished(): number {
        return 100.0 * this.closed_issues / (this.open_issues + this.closed_issues);
    }
    render(issues: Issue[])
    {
    	var result = '<li class="milestone">' +
    	'<div class="progress">' + this.renderProgress() + '</div>' + 
    	'<h3 class="title">' + this.title + '</h3>' +
    	'<p>' + this.description + '</p>' +
    	'<ul>';
    	for (var i = 0; i < issues.length; i++)
    		if (issues[i].milestone !== null && issues[i].milestone.id == this.id)
    			result += issues[i].render();
    	result += '</ul></li>';
    	return result;
    }
    private renderProgress(): string
    {
    	return 	'<span class="progress-bar">' +
    	'<span class="progress" style="width: ' + this.finished + '%" ></span>' + 
    	'<span class="percent">' + Math.round(this.finished) + '%</span>' +
    	'</span>';
    }

}