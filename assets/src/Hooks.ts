/**
 * 钩子
 */
class Hook {
    private _toDelete: boolean = false;
    /**
     * @param hook 钩子方法
     * @param thisArg 钩子方法的 this 指向
     * @param once 是否只执行一次
     */
    public constructor(protected hook: Function, protected thisArg: any, protected once: boolean = false) {}

    /**
     * 设置钩子
     * @param hook 钩子方法
     * @param thisArg 钩子方法的 this 指向
     * @param once 是否只执行一次
     */
    public set(hook: Function, thisArg: any, once: boolean = false) {
        this.hook = hook;
        this.thisArg = thisArg;
        this.once = once;
    }

    /**
     * 与目标钩子对比是否相同
     * @param hook 钩子方法
     * @param thisArg 钩子方法的 this 指向
     * @returns
     */
    public equals(hook: Function, thisArg: any) {
        return this.hook === hook && this.thisArg === thisArg;
    }

    /** 执行钩子 */
    public run() {
        if (!this._toDelete) {
            this.hook.apply(this.thisArg);
            if (this.once) {
                this._toDelete = true;
            }
        }
    }

    /**
     * 代入参数后执行钩子
     * @param args 参数列表
     */
    public runWith(...args: any[]) {
        if (!this._toDelete) {
            this.hook.apply(this.thisArg, args);
            if (this.once) {
                this._toDelete = true;
            }
        }
    }

    /** 是否有效 */
    public get invalid() {
        return this._toDelete;
    }
}

/**
 * 钩子集合
 */
export default class Hooks {
    /** 钩子列表 */
    private _hooks: Hook[];

    public constructor() {
        this._hooks = [];
    }

    /**
     * 添加钩子
     * @param hook 钩子方法
     * @param thisArg 钩子方法的 this 指向
     * @param once 是否只执行一次
     */
    public add(hook: Function, thisArg: any, once: boolean = false) {
        this._hooks.push(new Hook(hook, thisArg, once));
    }

    /**
     * 移除钩子
     * @param hook 钩子方法
     * @param thisArg 钩子方法的 this 指向
     */
    public remove(hook: Function, thisArg: any) {
        for (let i = this._hooks.length - 1; i >= 0; i--) {
            if (this._hooks[i].equals(hook, thisArg)) {
                this._hooks.splice(i, 1);
            }
        }
    }

    /** 移除所有钩子 */
    public clear() {
        this._hooks.length = 0;
    }

    /** 执行钩子 */
    public run() {
        for (let i = this._hooks.length - 1; i >= 0; i--) {
            this._hooks[i].run();
            if (this._hooks[i].invalid) {
                this._hooks.splice(i, 1);
            }
        }
    }

    /**
     * 代入参数后执行钩子
     * @param args 参数列表
     */
    public runWith(...args: any[]) {
        for (let i = this._hooks.length - 1; i >= 0; i--) {
            this._hooks[i].runWith(...args);
            if (this._hooks[i].invalid) {
                this._hooks.splice(i, 1);
            }
        }
    }
}
