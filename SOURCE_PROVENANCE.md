# Source Provenance

This working branch intentionally combines two existing **read-only** AppDeploy references. Neither AppDeploy application is to be modified or redeployed.

## 1) Functional / learning baseline

**AppDeploy:** `fired-heater-atlas-master-3d-zcsqh4`

- Live reference: https://fired-heater-atlas-master-3d-zcsqh4.v2.appdeploy.ai/
- Stable baseline: **v42**
- Snapshot: `1789194303900`
- Role: application structure, navigation, Atlas interaction, component study modules, Heater Types, Operation, Troubleshooting, responsive behavior and safety/training boundaries.

## 2) High-fidelity Blender 3D baseline

**AppDeploy:** `fired-heater-atlas-3d-nekrod`

- Live reference: https://fired-heater-atlas-3d-nekrod.v2.appdeploy.ai/
- Latest reference used here: **v21**
- Snapshot: `1789175113466`
- Role: Blender-exported **Fired Heater Atlas Web V13.6** viewer, GLTF/GLB loading, semantic object metadata, authored cameras, Blender-derived lights/material reconstruction, External/Cutaway/X-Ray logic, Fuel Gas / Purge Air / Instrumentation / BMS focus modes and component selection/search.

## Merge rule

The v42 application remains the functional/educational baseline while the v21 V13.6 viewer is the preferred source for high-fidelity model rendering and semantic 3D data. Technical behavior should not be invented merely to reconcile the two sources.

The large `Fired_Heater_Atlas_Web_V13_6.glb` binary is also preserved in the user's Drive source package; direct AppDeploy source-reading cannot return that binary because it exceeds the source tool's 5 MB read limit.
