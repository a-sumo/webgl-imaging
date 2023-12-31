export function testWindingOrder(indices: number[], vertices: number[]): boolean {
    for (let i = 0; i < indices.length; i += 3) {
        const index1 = indices[i] * 3;
        const index2 = indices[i + 1] * 3;
        const index3 = indices[i + 2] * 3;

        const v1 = [vertices[index1], vertices[index1 + 1], vertices[index1 + 2]];
        const v2 = [vertices[index2], vertices[index2 + 1], vertices[index2 + 2]];
        const v3 = [vertices[index3], vertices[index3 + 1], vertices[index3 + 2]];

        const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
        const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];

        const crossProduct = [
            edge1[1] * edge2[2] - edge1[2] * edge2[1],
            edge1[2] * edge2[0] - edge1[0] * edge2[2],
            edge1[0] * edge2[1] - edge1[1] * edge2[0]
        ];

        // The dot product of the cross product and the normal vector should be positive
        // if the winding order is counter-clockwise
        const dotProduct = crossProduct[0] * v1[0] + crossProduct[1] * v1[1] + crossProduct[2] * v1[2];

        if (dotProduct < 0) {
            return false;
        }
    }

    return true;
}
