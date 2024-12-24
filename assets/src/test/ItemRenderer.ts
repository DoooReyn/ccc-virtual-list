import { _decorator, Component, EventTouch, Label, Node, UITransform } from "cc";
import { TestVList } from "./TestVList";
const { ccclass } = _decorator;

/** 树节点数据 */
export type TreeItemData = [id: number, tree: number, text: string];

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
    private _data: string | TreeItemData = null;
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
            if (this._list.node.name.toLowerCase() == "tvlist") {
                const vitem = this._list.getVirtualItemAt(index);
                if (vitem && vitem.m) {
                    this.node.on(Node.EventType.TOUCH_START, this.onItemTouched, this);
                    this.node.on(Node.EventType.TOUCH_END, this.onItemTouched, this);
                }
            }
        }
    }

    /**
     * 树菜单节点被点击事件
     * @param e 触摸事件
     */
    private onItemTouched(e: EventTouch) {
        if (e.type == Node.EventType.TOUCH_END && e.getLocation().equals(e.getStartLocation())) {
            // console.log(`onItemTouched:`, this._index, this._data);
            const vitem = this._list.getVirtualItemAt(this._index);
            this._list.collapse(vitem);
        }
    }

    /** 子项被回收 */
    public onRecycled() {
        this.node.off(Node.EventType.SIZE_CHANGED, this.onItemSizeChanged, this);
        this.node.off(Node.EventType.TOUCH_START, this.onItemTouched, this);
        this.node.off(Node.EventType.TOUCH_END, this.onItemTouched, this);
        this.transformer.setContentSize(...this._list.getItemSize(0));
        this.node.active = false;
        this.label.isBold = false;
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
    public onRendered(data: string | [number, number, string], index: number) {
        this._data = data;
        this._index = index;
        if (typeof data == "string") {
            this.label.string = data;
        } else {
            this.label.isBold = data[0] > 0;
            this.label.string = data[2];
            this.label.updateRenderData();
        }
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
