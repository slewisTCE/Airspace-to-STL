import { BufferGeometry, Mesh, MeshPhongMaterial, type BufferGeometryEventMap, type NormalBufferAttributes, type Material } from "three";

export async function mergeGeometries(geometries: BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>[], material?: Material): Promise<Mesh> {
  const { BufferGeometryUtils } = await import("three/examples/jsm/Addons.js");
  const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
  if (material == undefined){
    material = new MeshPhongMaterial({ color: 0x00ff00 });
  }
  return new Mesh(mergedGeometry, material);
}