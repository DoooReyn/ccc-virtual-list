import Hooks from "./Hooks";

/**
 * 批量加载记录器
 */
export default class BatchLoader extends Hooks {
    /** 任务处理器 */
    private _processor: (item: any) => void;

    /** 任务加载器 */
    private _itemLoader: (err: any, item: any) => void;

    /**
     * 构造函数
     * @param _count 初始数量
     */
    constructor(private _count: number = 0) {
        super();
        this._itemLoader = this._onItemLoaded.bind(this);
    }

    /**
     * 任务加载完成回调
     * @param err 错误信息
     * @param item 任务
     */
    private _onItemLoaded(err: any, item: any) {
        if (err) console.error(err);
        if (this._processor && item) this._processor(item);
        this.dec();
    }

    /** 任务处理器 */
    public set processor(processor: (item: any) => void) {
        this._processor = processor;
    }

    /** 任务加载器 */
    public get itemLoader() {
        return this._itemLoader;
    }

    /** 完成一次 */
    public dec() {
        this._count--;
        if (this._count <= 0) {
            this._count = 0;
            this.run();
        }
    }
}
