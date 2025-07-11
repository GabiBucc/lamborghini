/*
 * Project :WebGL Car Configurator
 * File: sceneManager.js
 * Description : Handles 3D scene management
 * Date : 10/09/2021
 * License : MIT
 * Author : RendercodeNinja
 * URL : https://github.com/RendercodeNinja
 */

import { Mesh, MeshBasicMaterial } from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { ACTIVE_PATH, STAGE_PATH } from './config';
import { ColorUtils } from './utilities';

export const SceneManager = (() => {

    let glTFLoader = null;
    let mActiveModel = null;
    let mMeta = null; // ⬅️ DODANO: lokalna kopija meta podataka

    const init = (loaderManager) => {
        glTFLoader = new GLTFLoader(loaderManager);
    };

    const loadStage = (scene) => {
        if (!glTFLoader)
            throw new Error('SceneManager init should be called.');

        glTFLoader.setPath(STAGE_PATH).load('model.glb', model => {
            scene.add(model.scene);
        });
    };

    const loadActiveModel = (scene, meta) => {
        if (!glTFLoader)
            throw new Error('SceneManager init should be called.');

        mMeta = meta; // ⬅️ DODANO: spremi meta podatke

        const defBody = meta.body_colors.default;
        const defMirror = meta.mirror_colors.default;
        const defAlloys = meta.wheel_colors.default;
        const defCaliper = meta.caliper_colors.default;

        const dfCol_Body = ColorUtils.webColorToHex(meta.body_colors.colors[defBody].value);
        const dfCol_Mirror = ColorUtils.webColorToHex(meta.mirror_colors.colors[defMirror].value);
        const dfCol_Alloys = ColorUtils.webColorToHex(meta.wheel_colors.colors[defAlloys].value);
        const dfCol_Caliper = ColorUtils.webColorToHex(meta.caliper_colors.colors[defCaliper].value);

        glTFLoader.setPath(ACTIVE_PATH).load('model.glb', model => {
            mActiveModel = model.scene;

            mActiveModel.traverse(obj => {
                if (obj instanceof Mesh) {
                    if (obj.material.name === 'Mt_Body')
                        obj.material.color = dfCol_Body;
                    if (obj.material.name === 'Mt_MirrorCover')
                        obj.material.color = dfCol_Mirror;
                    if (obj.material.name === 'Mt_AlloyWheels')
                        obj.material.color = dfCol_Alloys;
                    if (obj.material.name === 'Mt_BrakeCaliper')
                        obj.material.color = dfCol_Caliper;
                    if (obj.material.name === 'Mt_Shadow_Plane')
                        obj.material = new MeshBasicMaterial({ color: 0xffffff, map: obj.material.map, transparent: true });
                }

                if (obj.name.includes('Obj_Rim') && !obj.name.includes(meta.wheel_designs.designs[0].value))
                    obj.visible = false;
            });

            scene.add(mActiveModel);
        });
    };

    const setEntityColor = (targetMat, webColor) => {
        mActiveModel.traverse(obj => {
            if (obj instanceof Mesh && obj.material.name === targetMat) {
                obj.material.color = ColorUtils.webColorToHex(webColor);
            }
        });

        if (!mMeta) return;

        let field = '';
        switch (targetMat) {
            case 'Mt_Body': field = 'boja'; break;
            case 'Mt_AlloyWheels': field = 'bojaDiskova'; break;
            case 'Mt_MirrorCover': field = 'bojaRetrovizora'; break;
            case 'Mt_BrakeCaliper': field = 'bojaTockova'; break;
            default: return;
        }

        console.log(mMeta)

        //const allColors = mMeta[`${field}_colors`].body_colors.colors;
        const allColors = mMeta.body_colors.colors;
        const entry = Object.values(allColors).find(c =>
            c.value.toLowerCase() === webColor.toLowerCase()
        );
        console.log(entry, 'entryy')
        console.log(field)
        console.log(entry.name)
        if (entry) {
            
            window.parent.postMessage({
                type: 'update-dropdown',
                field: field,
                value: entry.name
            }, '*');
        }
    };

    const setEntityVisible = (targetName) => {
        window.parent.postMessage({ type: 'tireType', value: targetName }, '*');

        mActiveModel.traverse(obj => {
            if (obj.name.includes('Obj_Rim')) {
                obj.visible = obj.name.includes(targetName);
            }
        });
    };

    return { init, loadStage, loadActiveModel, setEntityColor, setEntityVisible };

})();
