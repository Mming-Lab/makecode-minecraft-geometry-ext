namespace positions {
    /**
     * Rotate the position by specifying the origin, axis, and rotation angle.
     * @param targetCoordinates Position of rotation target
     * @param origin World position for the center of rotation
     * @param axisOfRevolution Axial direction of rotation
     * @param angle Angle (0~360)
     */
    //% weight=10
    //% blockId=minecraftRotateCoordinate
    //% block="rotate position $targetCoordinates around origin $origin on axis $axisOfRevolution by $angle degrees"
    //% targetCoordinates.shadow=minecraftCreateWorldInternal
    //% origin.shadow=minecraftCreateWorldInternal
    //% angle.min=0 angle.max=360 angle.defl=60
    export function RotateCoordinate(targetCoordinates: Position, origin: Position, axisOfRevolution: Axis, angle: number): Position {

        // 回転軸を表す単位ベクトル
        let n = [0, 0, 0];
        if (axisOfRevolution == Axis.X) {
            n[0] = 1;
        } else if (axisOfRevolution == Axis.Y) {
            n[1] = 1;
        } else if (axisOfRevolution == Axis.Z) {
            n[2] = 1;
        }

        // 角度から弧度への変換
        const PI = 3.14159;
        const radians = angle * (PI / 180);

        // 回転行列
        const sin = Math.sin(radians);
        const cos = Math.cos(radians);
        const c1 = 1 - cos;
        let R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        R[0][0] = c1 * (n[0] * n[0]) + cos;
        R[0][1] = c1 * (n[0] * n[1]) - n[2] * sin;
        R[0][2] = c1 * (n[0] * n[2]) + n[1] * sin;
        R[1][0] = c1 * (n[0] * n[1]) + n[2] * sin;
        R[1][1] = c1 * (n[1] * n[1]) + cos;
        R[1][2] = c1 * (n[1] * n[2]) - n[0] * sin;
        R[2][0] = c1 * (n[0] * n[2]) - n[1] * sin;
        R[2][1] = c1 * (n[1] * n[2]) + n[0] * sin;
        R[2][2] = c1 * (n[2] * n[2]) + cos;


        // 相対座標に変換
        const relativeCoords = pos(
            targetCoordinates.getValue(Axis.X) - origin.getValue(Axis.X),
            targetCoordinates.getValue(Axis.Y) - origin.getValue(Axis.Y),
            targetCoordinates.getValue(Axis.Z) - origin.getValue(Axis.Z)
        );

        // 相対座標に回転行列を適用
        const rotatedRelativeCoords = pos(
            R[0][0] * relativeCoords.getValue(Axis.X) + R[0][1] * relativeCoords.getValue(Axis.Y) + R[0][2] * relativeCoords.getValue(Axis.Z),
            R[1][0] * relativeCoords.getValue(Axis.X) + R[1][1] * relativeCoords.getValue(Axis.Y) + R[1][2] * relativeCoords.getValue(Axis.Z),
            R[2][0] * relativeCoords.getValue(Axis.X) + R[2][1] * relativeCoords.getValue(Axis.Y) + R[2][2] * relativeCoords.getValue(Axis.Z)
        );

        // 絶対座標に変換
        const result = positions.add(origin, rotatedRelativeCoords);
        return result;
    }

}
