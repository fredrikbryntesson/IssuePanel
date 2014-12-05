/*class Settings {
    private owner: string;
    private repository: string;
    private authorization: string;
    private title : string;
    
    
    
    saveForm()
    {
    	var authorization = makeBasicAuthentication(document.forms['configure']['user'].value, document.forms['configure']['password'].value);
    	saveSettings(
            document.forms['configure']['owner'].value,
            document.forms['configure']['repository'].value, 
            authorization,
            document.forms['configure']['title'].value
            );
        loadContent();
        return false;
    }
    saveSettings(owner, repository, authorization, title = null)
    {
    	var settings = { owner : owner, repository : repository, authorization : authorization, title : title };
    	localStorage.setItem("IssuePanel.settings", JSON.stringify(settings)); 
    }
    static load(): Settings
    {
    	return JSON.parse(localStorage.getItem("IssuePanel.settings")); 
    }
}*/