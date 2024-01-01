import { Object3D } from './Object3D';

export class Scene {
    private objects: Object3D[] = [];

    // Method to add an object to the scene
    addObject(object: Object3D) {
        this.objects.push(object);
    }

    // Method to remove an object from the scene
    removeObject(object: Object3D) {
        const index = this.objects.indexOf(object);
        if (index > -1) {
            this.objects.splice(index, 1);
        }
    }

    // Method to get all objects in the scene
    getObjects(): Object3D[] {
        return this.objects;
    }
}