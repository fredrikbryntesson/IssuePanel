declare function saveForm(): boolean;
declare function saveSettings(owner, repository, authorization, title?): void;
declare function loadSettings(): {
    owner: string;
    repository: string;
    authorization: string;
    title: string;
};
declare function loadContent(): boolean;
declare function makeBasicAuthentication(user, password): string;
declare function loadData(owner, repository, setHeader, title?): void;
declare function renderMilestone(milestone, issues): string;
declare function renderProgress(finished): string;
declare function renderIssue(issue): string;
declare function renderLabels(labels): string;
declare function loadMilestones(success, owner, repository, setHeader): void;
declare function loadIssues(success, owner, repository, setHeader, closed?: boolean): void;
