export default class Hook {
    public constructor(protected hook: Function, protected thisArg: any) {}
    public set(hook: Function, thisArg: any) {
        this.hook = hook;
        this.thisArg = thisArg;
    }
    public run() {
        this.hook.apply(this.thisArg);
    }
    public runWith(...args: any[]) {
        this.hook.apply(this.thisArg, args);
    }
}
