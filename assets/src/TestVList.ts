import ItemRenderer from "./ItemRenderer";
import { ListTestItemPool } from "./ListTestItemPool";
import { VirtualList } from "./VirtualList";
import { _decorator, Label, Node, UITransform } from "cc";
const { ccclass } = _decorator;

/** 诗词歌赋1 */
const POETRY1 = [
    "《永遇乐·京口北固亭怀古》\n辛弃疾〔宋〕",
    "千古江山",
    "英雄无觅",
    "孙仲谋处",
    "舞榭歌台",
    "风流总被",
    "雨打风吹去",
    "斜阳草树",
    "寻常巷陌",
    "人道寄奴曾住",
    "想当年",
    "金戈铁马",
    "气吞万里如虎",
    "元嘉草草",
    "封狼居胥",
    "赢得仓皇北顾",
    "四十三年",
    "望中犹记",
    "烽火扬州路",
    "可堪回首",
    "佛狸祠下",
    "一片神鸦社鼓",
    "凭谁问：",
    "廉颇老矣",
    "尚能饭否？",
] as const;

/** 诗词歌赋2 */
const POETRY2 = [
    "《",
    "江",
    "城",
    "子",
    "·",
    "密",
    "州",
    "出",
    "猎",
    "》",
    "苏",
    "轼",
    "〔",
    "宋",
    "〕",
    "老",
    "夫",
    "聊",
    "发",
    "少",
    "年",
    "狂",
    "，",
    "左",
    "牵",
    "黄",
    "，",
    "右",
    "擎",
    "苍",
    "，",
    "锦",
    "帽",
    "貂",
    "裘",
    "，",
    "千",
    "骑",
    "卷",
    "平",
    "冈",
    "。",
    "为",
    "报",
    "倾",
    "城",
    "随",
    "太",
    "守",
    "，",
    "亲",
    "射",
    "虎",
    "，",
    "看",
    "孙",
    "郎",
    "。",
    "酒",
    "酣",
    "胸",
    "胆",
    "尚",
    "开",
    "张",
    "。",
    "鬓",
    "微",
    "霜",
    "，",
    "又",
    "何",
    "妨",
    "！",
    "持",
    "节",
    "云",
    "中",
    "，",
    "何",
    "日",
    "遣",
    "冯",
    "唐",
    "？",
    "会",
    "挽",
    "雕",
    "弓",
    "如",
    "满",
    "月",
    "，",
    "西",
    "北",
    "望",
    "，",
    "射",
    "天",
    "狼",
    "。",
] as const;

/** 默认数据 */
const DEFAULT_DATA_SOURCE = {
    shlist: POETRY1,
    svlist: POETRY1,
    ghlist: POETRY2,
    gvlist: POETRY2,
} as const;

/** 模板名称 */
enum TemplateName {
    H = "HItem",
    V = "VItem",
    G = "GItem",
}

/**
 * 虚拟列表测试
 */
@ccclass("TestVList")
export class TestVList extends VirtualList {
    protected start(): void {
        const exportName = this.node.name.toLowerCase();
        this.data = DEFAULT_DATA_SOURCE[exportName].slice();
        (<any>window)[exportName] = this; // 测试用
    }

    protected onDestroy(): void {
        ListTestItemPool.inst.clear();
        super.onDestroy();
    }

    protected appendItem(index: number) {
        let item: Node;
        if (this.gridLayout) {
            item = ListTestItemPool.inst.acquire(TemplateName.G);
        } else {
            item = ListTestItemPool.inst.acquire(this.horizontal ? TemplateName.H : TemplateName.V);
        }
        item.addComponent(ItemRenderer).onAcquire(this, index);
        return item;
    }

    protected renderItem(item: Node, index: number) {
        item.getComponent(ItemRenderer)!.onRendered(this._dataSource[index], index);
    }

    protected recycleItem(item: Node): void {
        const renderer = item.getComponent(ItemRenderer)!;
        renderer.onRecycled();
        renderer.destroy();
        item.active = false;
        ListTestItemPool.inst.recycle(item);
    }

    public getItemSize(index: number): [number, number] {
        if (this.gridLayout) {
            return [100, 100];
        }
        if (this.horizontal) {
            return [120, 472];
        } else {
            return [640, 52];
        }
    }
}
