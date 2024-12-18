import { _decorator, Component, Label, Node, UITransform } from "cc";
import { TestVList } from "./TestVList";
const { ccclass } = _decorator;

/**
 * 列表子项渲染组件
 */
@ccclass("ItemRenderer")
export default class ItemRenderer extends Component {
    /** 列表组件 */
    private _list: TestVList = null;
    /** 子项索引 */
    private _index: number = -1;
    /** 子项数据 */
    private _data: string = null;
    /** 文本组件 */
    private _label: Label = null;
    /** 变换组件 */
    private _transformer: UITransform = null;

    /** 文本组件 */
    protected get label() {
        return (this._label ||= this.node.getChildByName("Label").getComponent(Label));
    }

    /** 变换组件 */
    protected get transformer() {
        return (this._transformer ||= this.node.getComponent(UITransform));
    }

    /** 子项数据 */
    public get data() {
        return this._data;
    }

    /** 子项索引 */
    public get index() {
        return this._index;
    }

    /**
     * 子项被创建
     * @param list 列表组件
     * @param index 子项索引
     */
    public onAcquire(list: TestVList, index: number) {
        this._list = list;
        this._index = index;
        if (this._list.singleLayout) {
            this.node.on(Node.EventType.SIZE_CHANGED, this.onItemSizeChanged, this);
        }
    }

    /** 子项被回收 */
    public onRecycled() {
        this.node.off(Node.EventType.SIZE_CHANGED, this.onItemSizeChanged, this);
        this.transformer.setContentSize(...this._list.getItemSize(0));
        this.label.string = "";
        this._list = null;
        this._index = -1;
        this._data = null;
    }

    /**
     * 更新子项内容
     * @param data 子项数据
     * @param index 子项索引
     */
    public onRendered(data: string, index: number) {
        this._data = data;
        this._index = index;
        this.label.string = data;
    }

    /** 节点尺寸变化 */
    protected onItemSizeChanged() {
        if (this._list.horizontal) {
            this._list.updateItemWidth(this._index, this.transformer.width);
        } else {
            this._list.updateItemHeight(this._index, this.transformer.height);
        }
    }
}
