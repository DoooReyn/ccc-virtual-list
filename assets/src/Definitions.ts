import { Enum } from "cc";

/** 列表滚动方向 */
export const LIST_DIRCTION = Enum({
    /** 水平 */
    HORIZONTAL: 0,
    /** 垂直 */
    VERTICAL: 1,
});

/** 列表布局方式 */
export const LIST_LAYOUT = Enum({
    /** 单项 */
    SINGLE: 0,
    /** 网格 */
    GRID: 1,
});

/** 列表滚动方式 */
export enum LIST_SCROLL_MODE {
    /** 停止滚动 */
    STOP = -1,
    /** 滚到指定位置 */
    POSITION = 0,
    /** 滚到指定索引位置 */
    INDEX,
    /** 滚到起始处 */
    START,
    /** 滚到结束处 */
    END,
}

/** 回弹类型 */
export enum BounceType {
    /** 无回弹 */
    NONE = 0,
    /** 在起始处回弹 */
    START,
    /** 在结束处回弹 */
    END,
}
