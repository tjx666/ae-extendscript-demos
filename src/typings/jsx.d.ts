/**
 * 补充 AE ExtendScript 环境类型
 */

interface $ {
    /** 获取当前内存分配情况 */
    summary: () => string;
}

interface TextDocument {
    /** The text layer's spacing between lines */
    leading: number;
}

enum BlendingMode {
    SUBTRACT,
    DIVIDE,
}
