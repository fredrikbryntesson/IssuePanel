class Label {
    private color: string;
    private name: string;
    constructor() {
    }

    Render() : string {
        return '<span style="background: #' + this.color + '">' + this.name + '</span>';
    }

}