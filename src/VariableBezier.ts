
namespace shapes {
    /**
 * Place blocks along a bezier curve with variable number of control points.
 * @param startPoint Starting position of the curve
 * @param controlPoints Array of control points that influence the curve shape
 * @param endPoint Ending position of the curve
 * @param blockType Block type to place
 */
    //% weight=8
    //% blockId=minecraftPlaceVariableBezierCurve
    //% block="place %block=minecraftBlock blocks in variable bezier curve from $startPoint to $endPoint with control points $controlPoints"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% startPoint.shadow=minecraftCreateWorldInternal
    //% endPoint.shadow=minecraftCreateWorldInternal
    export function PlaceVariableBezierCurve(startPoint: Position, controlPoints: Position[], endPoint: Position, block: number): void {
        // 全制御点を結合（開始 + 制御点配列 + 終了）
        const 全制御点: Position[] = [startPoint];
        for (let i = 0; i < controlPoints.length; i++) {
            全制御点.push(controlPoints[i]);
        }
        全制御点.push(endPoint);

        const n = 全制御点.length - 1; // 次数

        // 二項係数の計算
        function 二項係数(n: number, k: number): number {
            if (k > n) return 0;
            if (k === 0 || k === n) return 1;

            let result = 1;
            for (let i = 0; i < k; i++) {
                result = result * (n - i) / (i + 1);
            }
            return result;
        }

        // n次ベジェ曲線上の位置を計算する内部関数
        function ベジェ計算(t: number): Position {
            let x = 0, y = 0, z = 0;

            for (let i = 0; i <= n; i++) {
                // ベルンシュタイン基底多項式: B_i,n(t) = C(n,i) * (1-t)^(n-i) * t^i
                const 係数 = 二項係数(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i);
                x += 係数 * 全制御点[i].getValue(Axis.X);
                y += 係数 * 全制御点[i].getValue(Axis.Y);
                z += 係数 * 全制御点[i].getValue(Axis.Z);
            }

            return world(Math.round(x), Math.round(y), Math.round(z));
        }

        // 効率的なブロック配置アルゴリズム
        let 前回位置 = ベジェ計算(0);
        blocks.place(block, 前回位置);

        let t = 0;
        const ステップ幅 = 0.01; // 適度なステップサイズ

        while (t < 1.0) {
            t += ステップ幅;
            if (t > 1.0) t = 1.0;

            const 次位置 = ベジェ計算(t);

            // 座標が変わった場合のみブロック配置
            if (!positions.equals(前回位置, 次位置)) {
                blocks.place(block, 次位置);
                前回位置 = 次位置;
            }

            if (t >= 1.0) break;
        }
    }
}
