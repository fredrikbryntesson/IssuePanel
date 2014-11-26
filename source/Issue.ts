class Issue {
    private number: number;
    private state: string;
    private title: string;
    private assignee: Assignee;
    private labels: Label[];
    milestone;
    constructor() {
    }
    render(): string {
    	return '<li id="issue_' + this.number + '" class="issue ' + this.state + '">' + 
    	'<span class="number">#' + this.number + '</span>' +
    	'<h4 class="title">' + this.title + 
    	'</h4>' +
    	//'<p>' + this.body + '</p>' +
    	'<div class="meta">' +
    	'<span>' + (this.assignee !== null ? this.assignee.Render() : '') + '</span>' +
    	this.renderLabels() +
    	'</div></li>';
    }
    private renderLabels(): string {
    	var result = '';
    	if (this.labels !== null)
    	{
    		result += '<span class="labels">';
    		for (var k = 0; k < this.labels.length; k++)
    			result += this.labels[k].Render();
    		result += '</span>';
    	}
    	return result;
    }
}