import { BufferGeometry, Mesh, MeshPhongMaterial, type BufferGeometryEventMap, type NormalBufferAttributes } from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

export function mergeGeometries(geometries: BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>[], material?: any) {
  const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
  if (material == undefined){
    material = new MeshPhongMaterial({ color: 0x00ff00 });
  }
  return new Mesh(mergedGeometry, material);
}