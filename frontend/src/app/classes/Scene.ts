import { Object3D } from './Object3D';

export class Scene {
    private objects: { [name: string]: Object3D } = {};

    // Method to add an object to the scene with a name
    addObject(name: string, object: Object3D) {
        if (this.objects[name]) {
            throw new Error(`An object with the name "${name}" already exists in the scene.`);
        }
        this.objects[name] = object;
    }


    // Method to remove an object from the scene by its name
    removeObject(name: string) {
        delete this.objects[name];
    }

    // Method to get all objects in the scene
    getObjects(): Object3D[] {
        return Object.values(this.objects);
    }

    // Method to get an object by its name
    getObject(name: string): Object3D | undefined {
        return this.objects[name];
    }
}