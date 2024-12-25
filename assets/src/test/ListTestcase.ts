import { _decorator, Component, Node, EditBox, misc, Button, Sprite, Color, resources, Prefab, Label } from "cc";
import { TestVList } from "./TestVList";
import { ListTestItemPool } from "./ListTestItemPool";
import BatchLoader from "../BatchLoader";
import { CHINESE } from "./Chinese";
import { EVENT_TYPE } from "../VirtualList";
const { ccclass, property } = _decorator;

/** 案例选择 */
type TestCaseMode = "n" | "sh" | "sv" | "gh" | "gv" | "tv";

/** 背景颜色 */
const BACKGROUND_COLOR = {
    ON: new Color(255, 255, 255),
    OFF: new Color(160, 160, 160),
} as const;

/**
 * 虚拟列表测试示例
 * - 聊天列表
 */
@ccclass("ListTestcase")
export class ListTestcase extends Component {
    @property(TestVList)
    $hlist: TestVList = null;

    @property(TestVList)
    $vlist: TestVList = null;

    @property(TestVList)
    $ghlist: TestVList = null;

    @property(TestVList)
    $gvlist: TestVList = null;

    @property(TestVList)
    $tvlist: TestVList = null;

    @property(EditBox)
    $editbox: EditBox = null;

    @property(EditBox)
    $jumpbox: EditBox = null;

    @property(Node)
    $shbtn: Node = null;

    @property(Node)
    $svbtn: Node = null;

    @property(Node)
    $ghbtn: Node = null;

    @property(Node)
    $gvbtn: Node = null;

    @property(Node)
    $tvbtn: Node = null;

    @property(Node)
    $gabtn: Node = null;

    @property(Node)
    $grbtn: Node = null;

    @property(Node)
    $startbtn: Node = null;

    @property(Node)
    $endbtn: Node = null;

    @property(Label)
    $total: Label = null;

    @property(Label)
    $items: Label = null;

    private _mode: TestCaseMode = "n";

    /** 是否水平滚动单项布局案例 */
    public get isModeSH() {
        return this._mode == "sh";
    }

    /** 是否垂直滚动单项布局案例 */
    public get isModeSV() {
        return this._mode == "sv";
    }

    /** 是否水平滚动网格布局案例 */
    public get isModeGH() {
        return this._mode == "gh";
    }

    /** 是否垂直滚动网格布局案例 */
    public get isModeGV() {
        return this._mode == "gv";
    }

    /** 是否垂直树形布局案例 */
    public get isModeTV() {
        return this._mode == "tv";
    }

    /** 设置数据量 */
    public setTotal(dataCount: number) {
        this.$total.string = `数据量: ${dataCount}`;
    }

    /** 设置节点数 */
    public setItemCount(itemCount: number) {
        this.$items.string = `节点数：${itemCount}`;
    }

    protected start(): void {
        const queueLoader = new BatchLoader(3);
        queueLoader.add(this.onLoadComplete, this);
        const oncomplete = (err: Error, res: Prefab) => {
            if (err) console.error(err);
            if (res) ListTestItemPool.inst.add(res);
            queueLoader.dec();
        };
        resources.load("HItem", Prefab, oncomplete);
        resources.load("VItem", Prefab, oncomplete);
        resources.load("GItem", Prefab, oncomplete);
    }

    protected onEnable(): void {
        this.$editbox.node.on(EditBox.EventType.EDITING_RETURN, this.onSendMsg, this);
        this.$jumpbox.node.on(EditBox.EventType.EDITING_RETURN, this.onJumpTo, this);
        this.$hlist.node.on(EVENT_TYPE.DATA_CHANGED, this.onDataChanged, this);
        this.$vlist.node.on(EVENT_TYPE.DATA_CHANGED, this.onDataChanged, this);
        this.$ghlist.node.on(EVENT_TYPE.DATA_CHANGED, this.onDataChanged, this);
        this.$gvlist.node.on(EVENT_TYPE.DATA_CHANGED, this.onDataChanged, this);
        this.$tvlist.node.on(EVENT_TYPE.DATA_CHANGED, this.onDataChanged, this);
        this.$hlist.node.on(EVENT_TYPE.ITEM_SHOW, this.onItemCountChanged, this);
        this.$hlist.node.on(EVENT_TYPE.ITEM_HIDE, this.onItemCountChanged, this);
        this.$vlist.node.on(EVENT_TYPE.ITEM_SHOW, this.onItemCountChanged, this);
        this.$vlist.node.on(EVENT_TYPE.ITEM_HIDE, this.onItemCountChanged, this);
        this.$ghlist.node.on(EVENT_TYPE.ITEM_SHOW, this.onItemCountChanged, this);
        this.$ghlist.node.on(EVENT_TYPE.ITEM_HIDE, this.onItemCountChanged, this);
        this.$gvlist.node.on(EVENT_TYPE.ITEM_SHOW, this.onItemCountChanged, this);
        this.$gvlist.node.on(EVENT_TYPE.ITEM_HIDE, this.onItemCountChanged, this);
        this.$tvlist.node.on(EVENT_TYPE.ITEM_SHOW, this.onItemCountChanged, this);
        this.$tvlist.node.on(EVENT_TYPE.ITEM_HIDE, this.onItemCountChanged, this);
        this.$shbtn.on(Button.EventType.CLICK, this.onChangeModeSH, this);
        this.$svbtn.on(Button.EventType.CLICK, this.onChangeModeSV, this);
        this.$ghbtn.on(Button.EventType.CLICK, this.onChangeModeGH, this);
        this.$gvbtn.on(Button.EventType.CLICK, this.onChangeModeGV, this);
        this.$tvbtn.on(Button.EventType.CLICK, this.onChangeModeTV, this);
        this.$gabtn.on(Button.EventType.CLICK, this.onAddItem, this);
        this.$grbtn.on(Button.EventType.CLICK, this.onRemoveItem, this);
        this.$startbtn.on(Button.EventType.CLICK, this.onScrollToStart, this);
        this.$endbtn.on(Button.EventType.CLICK, this.onSrollToEnd, this);

        this.$vlist.node.on(EVENT_TYPE.DATA_CHANGED, (count: number) => console.log("数据量变化", count), this);
        this.$vlist.node.on(EVENT_TYPE.SCROLL_TO_END, () => console.log("滚到末尾"), this);
        this.$vlist.node.on(EVENT_TYPE.SCROLL_TO_START, () => console.log("滚到开头"), this);
        this.$vlist.node.on(EVENT_TYPE.BOUNCE_END, () => console.log("末尾回弹"), this);
        this.$vlist.node.on(EVENT_TYPE.BOUNCE_START, () => console.log("开头回弹"), this);
        this.$vlist.node.on(EVENT_TYPE.SCROLL_TO_INDEX, (index: number) => console.log("滚到索引", index), this);
        this.$vlist.node.on(EVENT_TYPE.INERTIA_SCROLLING, () => console.log("惯性滚动中"), this);
    }

    protected onDisable(): void {
        this.$editbox.node.off(EditBox.EventType.EDITING_RETURN, this.onSendMsg, this);
        this.$jumpbox.node.off(EditBox.EventType.EDITING_RETURN, this.onJumpTo, this);
        this.$hlist.node.off(EVENT_TYPE.DATA_CHANGED, this.onDataChanged, this);
        this.$vlist.node.off(EVENT_TYPE.DATA_CHANGED, this.onDataChanged, this);
        this.$ghlist.node.off(EVENT_TYPE.DATA_CHANGED, this.onDataChanged, this);
        this.$gvlist.node.off(EVENT_TYPE.DATA_CHANGED, this.onDataChanged, this);
        this.$tvlist.node.off(EVENT_TYPE.DATA_CHANGED, this.onDataChanged, this);
        this.$hlist.node.off(EVENT_TYPE.ITEM_SHOW, this.onItemCountChanged, this);
        this.$hlist.node.off(EVENT_TYPE.ITEM_HIDE, this.onItemCountChanged, this);
        this.$vlist.node.off(EVENT_TYPE.ITEM_SHOW, this.onItemCountChanged, this);
        this.$vlist.node.off(EVENT_TYPE.ITEM_HIDE, this.onItemCountChanged, this);
        this.$ghlist.node.off(EVENT_TYPE.ITEM_SHOW, this.onItemCountChanged, this);
        this.$ghlist.node.off(EVENT_TYPE.ITEM_HIDE, this.onItemCountChanged, this);
        this.$gvlist.node.off(EVENT_TYPE.ITEM_SHOW, this.onItemCountChanged, this);
        this.$gvlist.node.off(EVENT_TYPE.ITEM_HIDE, this.onItemCountChanged, this);
        this.$tvlist.node.off(EVENT_TYPE.ITEM_SHOW, this.onItemCountChanged, this);
        this.$tvlist.node.off(EVENT_TYPE.ITEM_HIDE, this.onItemCountChanged, this);
        this.$shbtn.off(Button.EventType.CLICK, this.onChangeModeSH, this);
        this.$svbtn.off(Button.EventType.CLICK, this.onChangeModeSV, this);
        this.$ghbtn.off(Button.EventType.CLICK, this.onChangeModeGH, this);
        this.$gvbtn.off(Button.EventType.CLICK, this.onChangeModeGV, this);
        this.$tvbtn.off(Button.EventType.CLICK, this.onChangeModeTV, this);
        this.$gabtn.off(Button.EventType.CLICK, this.onAddItem, this);
        this.$grbtn.off(Button.EventType.CLICK, this.onRemoveItem, this);
        this.$startbtn.off(Button.EventType.CLICK, this.onScrollToStart, this);
        this.$endbtn.off(Button.EventType.CLICK, this.onSrollToEnd, this);
    }

    private onItemCountChanged(index: number) {
        const list = this.getListByMode();
        this.$items.string = `节点数：${list.realItemCount}`;
    }

    private onDataChanged() {
        const list = this.getListByMode();
        this.setTotal(list.count);
    }

    /** 预制体加载完成 */
    private onLoadComplete() {
        this.changeMode("sh");
    }

    /**
     * 切换案例
     * @param mode 案例
     * @returns
     */
    private changeMode(mode: TestCaseMode) {
        if (this._mode == mode) return;

        this._mode = mode;
        this.$hlist.node.active = this.isModeSH;
        this.$vlist.node.active = this.isModeSV;
        this.$ghlist.node.active = this.isModeGH;
        this.$gvlist.node.active = this.isModeGV;
        this.$tvlist.node.active = this.isModeTV;
        this.$editbox.node.active = this.isModeSH || this.isModeSV;
        this.$gabtn.active = this.isModeGH || this.isModeGV;
        this.$grbtn.active = this.isModeGH || this.isModeGV;
        this.$shbtn.getComponent(Sprite).color = this.isModeSH ? BACKGROUND_COLOR.ON : BACKGROUND_COLOR.OFF;
        this.$svbtn.getComponent(Sprite).color = this.isModeSV ? BACKGROUND_COLOR.ON : BACKGROUND_COLOR.OFF;
        this.$ghbtn.getComponent(Sprite).color = this.isModeGH ? BACKGROUND_COLOR.ON : BACKGROUND_COLOR.OFF;
        this.$gvbtn.getComponent(Sprite).color = this.isModeGV ? BACKGROUND_COLOR.ON : BACKGROUND_COLOR.OFF;
        this.$tvbtn.getComponent(Sprite).color = this.isModeTV ? BACKGROUND_COLOR.ON : BACKGROUND_COLOR.OFF;
        this.onDataChanged();
    }

    /** 随机插入几项 */
    private onAddItem() {
        const count = (Math.random() * 10 + 1) | 0;
        const list = this.isModeGH ? this.$ghlist : this.$gvlist;
        for (let i = 0, r: number, index: number, text: string; i < count; i++) {
            r = Math.random();
            index = (r * list.count) | 0;
            text = CHINESE.RandomChineseChar();
            list.insertAt(index, text);
        }
    }

    /** 随机移除一项 */
    private onRemoveItem() {
        const list = this.isModeGH ? this.$ghlist : this.$gvlist;
        if (list.count > 0) {
            list.removeAt((Math.random() * list.count) | 0);
        }
    }

    /** 切换到水平滚动单项布局案例 */
    private onChangeModeSH() {
        this.changeMode("sh");
    }

    /** 切换到垂直滚动单项布局案例 */
    private onChangeModeSV() {
        this.changeMode("sv");
    }

    /** 切换到水平滚动网格布局案例 */
    private onChangeModeGH() {
        this.changeMode("gh");
    }

    /** 切换到垂直滚动网格布局案例 */
    private onChangeModeGV() {
        this.changeMode("gv");
    }

    /** 切换到垂直树形案例 */
    private onChangeModeTV() {
        this.changeMode("tv");
    }

    private getListByMode() {
        let list: TestVList;
        if (this.isModeSH) {
            list = this.$hlist;
        } else if (this.isModeSV) {
            list = this.$vlist;
        } else if (this.isModeGH) {
            list = this.$ghlist;
        } else if (this.isModeGV) {
            list = this.$gvlist;
        } else if (this.isModeTV) {
            list = this.$tvlist;
        }
        return list;
    }

    /** 滚动到起始处 */
    private onScrollToStart() {
        this.getListByMode().scrollToStart(0.5);
    }

    /** 滚动到结束处 */
    private onSrollToEnd() {
        this.getListByMode().scrollToEnd(0.5);
    }

    /** 发送聊天消息文本 */
    private onSendMsg() {
        const text = this.$editbox.string;
        if (text.length > 0) {
            const list = this.isModeSH ? this.$hlist : this.$vlist;
            list.insertEnd(text);
        }
        this.$editbox.string = "";
        misc.callInNextTick(() => {
            this.$editbox.setFocus();
        });
    }

    /** 跳转到指定索引 */
    private onJumpTo() {
        const text = this.$jumpbox.string;
        if (text.length > 0) {
            const index = parseInt(text);
            const list = this.getListByMode();
            list.scrollToIndex(index, 0.3);
        }
        misc.callInNextTick(() => {
            this.$jumpbox.setFocus();
        });
    }
}
