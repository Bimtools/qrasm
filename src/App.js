import logo from "./logo.svg";
import "./App.css";
import * as WorkspaceAPI from "trimble-connect-workspace-api";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  GetDrawingRequest,
  UpdateViewVisibilityRequest,
  GetTrbModelRequest,
  GetAnnIdRequest,
  ShowAnnRequest,
} from "./store/drawing/action";
import {
  ScissorOutlined,
  EyeInvisibleFilled,
  EyeFilled,
} from "@ant-design/icons";
import { Button, List, Typography } from "antd";

const { Text } = Typography;
function App() {
  const dispatch = useDispatch();
  const views = useSelector((state) => state.drawing.payload);
  const trimBimModels = useSelector((state) => state.drawing.trbModels);
  const annIds = useSelector((state) => state.drawing.annIds);
  const showAnn = useSelector((state) => state.drawing.showAnn);
  const loading = useSelector((state) => state.drawing.pending);
  const [asm, setAsm] = useState();
  const [modelId, setModelId] = useState();

  // function parseUrlParams() {
  //   const [, query] = window.location.href.split("?");
  //   if (!query) throw new Error("Missing URL params");

  //   const ifcGuid = query.split("ibim")[0];
  //   const fileId = query.split("ibim")[1];

  //   if (!ifcGuid || ifcGuid.length !== 22)
  //     throw new Error(`Invalid ifcGuid: "${ifcGuid}"`);
  //   if (!fileId) throw new Error("Missing fileId");

  //   return { ifcGuid, fileId };
  // }

  // async function waitForModels(tcapi) {
  //   let models;
  //   do {
  //     models = await tcapi.viewer.getModels();
  //   } while (!models?.length);
  //   return models;
  // }

  // async function waitForObjects(tcapi) {
  //   let objects;
  //   do {
  //     objects = await tcapi.viewer.getObjects();
  //   } while (!objects?.length);
  //   return objects;
  // }

  // // --- Phase 1: Initialise ---

  // async function initSession(tcapi) {
  //   const token = await tcapi.extension.requestPermission("accesstoken");
  //   window.localStorage.setItem("trimbleToken", token);
  // }

  // // --- Phase 2: Load model & isolate object ---

  // async function loadAndIsolateModel(tcapi, ifcGuid) {
  //   const models = await waitForModels(tcapi);

  //   // Kick off annotation model look-up in parallel
  //   for (const model of models) {
  //     if (model.name.includes(".trb")) {
  //       dispatch(GetAnnIdRequest({ name: model.name, modelId: model.id }));
  //     }
  //   }

  //   await tcapi.viewer.reset();

  //   for (const model of models) {
  //     if (!model.name.includes(".ifc") && !model.name.includes(".tekla"))
  //       continue;

  //     const alreadyLoaded = await tcapi.viewer.getLoadedModel(model.id);
  //     if (!alreadyLoaded) {
  //       await tcapi.viewer.toggleModel(model.id, true, true);
  //     }

  //     await tcapi.viewer.setCamera("reset");
  //     await waitForObjects(tcapi);

  //     const runtimeIds = await tcapi.viewer.convertToObjectRuntimeIds(
  //       model.id,
  //       [ifcGuid],
  //     );
  //     if (runtimeIds?.length && runtimeIds[0] >= 0) {
  //       return { modelId: model.id, runtimeId: runtimeIds[0] };
  //     }
  //   }

  //   throw new Error(`No model found containing ifcGuid: ${ifcGuid}`);
  // }

  // async function selectAndFocus(tcapi, modelId, runtimeId) {
  //   await tcapi.viewer.setSelection({
  //     modelObjectIds: [{ modelId, objectRuntimeIds: [runtimeId] }],
  //   });
  //   await tcapi.viewer.isolateEntities([{ modelId, entityIds: [runtimeId] }]);
  //   await tcapi.viewer.setCamera({
  //     modelObjectIds: [{ modelId, objectRuntimeIds: [runtimeId] }],
  //   });
  // }

  // // --- Phase 3: Render annotations ---

  // async function renderAnnotations(tcapi, modelId, runtimeId, annIds, views) {
  //   const annObjs = annIds.find((x) => x.name === views[0]?.file);
  //   if (!annObjs)
  //     throw new Error("No annotation object matches the current view");

  //   const ifcBoltRuntimeIds = await tcapi.viewer.convertToObjectRuntimeIds(
  //     modelId,
  //     views[0].ifcBoltIds,
  //   );

  //   await tcapi.viewer.isolateEntities([
  //     { modelId, entityIds: [runtimeId, ...ifcBoltRuntimeIds] },
  //   ]);

  //   const alreadyLoaded = await tcapi.viewer.getLoadedModel(annObjs.modelId);
  //   if (!alreadyLoaded) {
  //     await tcapi.viewer.toggleModel(annObjs.modelId, true, false);
  //   }

  //   tcapi.viewer.setObjectState(
  //     { modelObjectIds: [{ modelId: annObjs.modelId }] },
  //     { visible: true, color: { r: 255, g: 0, b: 0 } },
  //   );

  //   dispatch(ShowAnnRequest(false));
  // }

  // // --- Entry point ---

  // async function fetchData(annIds, views) {
  //   try {
  //     const { ifcGuid, fileId } = parseUrlParams();

  //     dispatch(GetDrawingRequest({ id: fileId }));

  //     const tcapi = await WorkspaceAPI.connect(window.parent);
  //     await initSession(tcapi);

  //     const { modelId, runtimeId } = await loadAndIsolateModel(tcapi, ifcGuid);
  //     setAsm(runtimeId);
  //     setModelId(modelId);

  //     await selectAndFocus(tcapi, modelId, runtimeId);
  //     await renderAnnotations(tcapi, modelId, runtimeId, annIds, views);
  //   } catch (err) {
  //     console.error("[fetchData]", err);
  //   }
  // }
  // React.useEffect(() => {
  //   fetchData();
  // }, []);

  const tcapiRef = React.useRef(null);
  const renderedAnnRef = React.useRef(false);

  function parseUrlParams() {
    const [, query] = window.location.href.split("?");
    if (!query) throw new Error("Missing URL params");

    const ifcGuid = query.split("ibim")[0];
    const fileId = query.split("ibim")[1];

    if (!ifcGuid || ifcGuid.length !== 22)
      throw new Error(`Invalid ifcGuid: "${ifcGuid}"`);

    if (!fileId) throw new Error("Missing fileId");

    return { ifcGuid, fileId };
  }

  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForModels(tcapi) {
    let models = [];

    while (!models?.length) {
      models = await tcapi.viewer.getModels();
      if (!models?.length) await sleep(300);
    }

    return models;
  }

  async function waitForObjects(tcapi) {
    let objects = [];

    while (!objects?.length) {
      objects = await tcapi.viewer.getObjects();
      if (!objects?.length) await sleep(300);
    }

    return objects;
  }

  async function initSession(tcapi) {
    const token = await tcapi.extension.requestPermission("accesstoken");
    window.localStorage.setItem("trimbleToken", token);
  }

  async function loadAndIsolateModel(tcapi, ifcGuid) {
    const models = await waitForModels(tcapi);

    for (const model of models) {
      if (model.name?.includes(".trb")) {
        dispatch(GetAnnIdRequest({ name: model.name, modelId: model.id }));
      }
    }

    await tcapi.viewer.reset();

    for (const model of models) {
      const name = model.name?.toLowerCase() || "";

      if (!name.includes(".ifc") && !name.includes(".tekla")) {
        continue;
      }

      const alreadyLoaded = await tcapi.viewer.getLoadedModel(model.id);

      if (!alreadyLoaded) {
        await tcapi.viewer.toggleModel(model.id, true, true);
      }

      await tcapi.viewer.setCamera("reset");
      await waitForObjects(tcapi);

      const runtimeIds = await tcapi.viewer.convertToObjectRuntimeIds(
        model.id,
        [ifcGuid],
      );

      if (runtimeIds?.length && runtimeIds[0] >= 0) {
        return {
          modelId: model.id,
          runtimeId: runtimeIds[0],
        };
      }
    }

    throw new Error(`No model found containing ifcGuid: ${ifcGuid}`);
  }

  async function selectAndFocus(tcapi, modelId, runtimeId) {
    await tcapi.viewer.setSelection({
      modelObjectIds: [
        {
          modelId,
          objectRuntimeIds: [runtimeId],
        },
      ],
    });

    await tcapi.viewer.isolateEntities([
      {
        modelId,
        entityIds: [runtimeId],
      },
    ]);

    await tcapi.viewer.setCamera({
      modelObjectIds: [
        {
          modelId,
          objectRuntimeIds: [runtimeId],
        },
      ],
    });
  }

  async function renderAnnotations(tcapi, modelId, runtimeId, annIds, views) {
    if (!annIds?.length) return;
    if (!views?.length) return;

    const currentView = views[0];

    const annObjs = annIds.find((x) => x.name === currentView?.file);

    if (!annObjs) {
      console.warn("No annotation object matches the current view");
      return;
    }

    const ifcBoltRuntimeIds = currentView?.ifcBoltIds?.length
      ? await tcapi.viewer.convertToObjectRuntimeIds(
          modelId,
          currentView.ifcBoltIds,
        )
      : [];

    await tcapi.viewer.isolateEntities([
      {
        modelId,
        entityIds: [runtimeId, ...ifcBoltRuntimeIds],
      },
    ]);

    const alreadyLoaded = await tcapi.viewer.getLoadedModel(annObjs.modelId);

    if (!alreadyLoaded) {
      await tcapi.viewer.toggleModel(annObjs.modelId, true, false);
    }

    await tcapi.viewer.setObjectState(
      {
        modelObjectIds: [
          {
            modelId: annObjs.modelId,
          },
        ],
      },
      {
        visible: true,
        color: {
          r: 255,
          g: 0,
          b: 0,
        },
      },
    );

    dispatch(ShowAnnRequest(false));
  }

  async function fetchData() {
    try {
      const { ifcGuid, fileId } = parseUrlParams();

      dispatch(GetDrawingRequest({ id: fileId }));

      const tcapi = await WorkspaceAPI.connect(window.parent);
      tcapiRef.current = tcapi;

      await initSession(tcapi);

      const { modelId, runtimeId } = await loadAndIsolateModel(tcapi, ifcGuid);

      setAsm(runtimeId);
      setModelId(modelId);

      await selectAndFocus(tcapi, modelId, runtimeId);
    } catch (err) {
      console.error("[fetchData]", err);
    }
  }

  // Init chỉ chạy 1 lần
  React.useEffect(() => {
    fetchData();
  }, []);

  // Đợi annIds + views có rồi mới render annotation
  React.useEffect(() => {
    async function run() {
      if (renderedAnnRef.current) return;

      if (!tcapiRef.current) return;
      if (!modelId) return;
      if (!asm) return;
      if (!annIds?.length) return;
      if (!views?.length) return;

      renderedAnnRef.current = true;

      try {
        await renderAnnotations(tcapiRef.current, modelId, asm, annIds, views);
      } catch (err) {
        renderedAnnRef.current = false;
        console.error("[renderAnnotations]", err);
      }
    }

    run();
  }, [annIds, views, modelId, asm]);

  return (
    <div className="App">
      <List>
        <List.Item
          style={{
            marginLeft: "5px",
            marginRight: "5px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              columnGap: "2px",
            }}
          >
            <Text ellipsis strong style={{ fontSize: "15px" }}>
              {views[0]?.file}
            </Text>
          </div>
        </List.Item>
        <List.Item
          style={{
            marginLeft: "5px",
            marginRight: "5px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              columnGap: "2px",
            }}
          >
            {showAnn ? (
              <Button
                type="primary"
                onClick={async () => {
                  const tcapi = await WorkspaceAPI.connect(window.parent);
                  const annObjs = annIds.find((x) => x.name === views[0]?.file);
                  console.log(annIds);
                  console.log(views[0]);
                  const loadedModel = await tcapi.viewer.getLoadedModel(
                    annObjs.modelId,
                  );
                  const ifcBoltIds = views[0].ifcBoltIds;
                  var ifcBoltRuntimeIds =
                    await tcapi.viewer.convertToObjectRuntimeIds(
                      modelId,
                      ifcBoltIds,
                    );
                  await tcapi.viewer.isolateEntities([
                    {
                      modelId: modelId,
                      entityIds: [asm, ...ifcBoltRuntimeIds],
                    },
                  ]);

                  if (loadedModel !== undefined) {
                    await tcapi.viewer.toggleModel(
                      annObjs.modelId,
                      false,
                      false,
                    );
                  }
                  dispatch(ShowAnnRequest(true));
                }}
              >
                Hide Dimensions
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={async () => {
                  const tcapi = await WorkspaceAPI.connect(window.parent);
                  const annObjs = annIds.find((x) => x.name === views[0]?.file);
                  console.log(annIds);
                  console.log(views[0]);
                  const loadedModel = await tcapi.viewer.getLoadedModel(
                    annObjs.modelId,
                  );
                  const ifcBoltIds = views[0].ifcBoltIds;
                  var ifcBoltRuntimeIds =
                    await tcapi.viewer.convertToObjectRuntimeIds(
                      modelId,
                      ifcBoltIds,
                    );
                  await tcapi.viewer.isolateEntities([
                    {
                      modelId: modelId,
                      entityIds: [asm, ...ifcBoltRuntimeIds],
                    },
                  ]);
                  // tcapi.viewer.setObjectState(
                  //   {
                  //     modelObjectIds: [
                  //       {
                  //         modelId: modelId,
                  //         objectRuntimeIds: ifcBoltRuntimeIds,
                  //       },
                  //     ],
                  //   },
                  //   {
                  //     visible: true,
                  //   },
                  // );

                  if (loadedModel === undefined) {
                    await tcapi.viewer.toggleModel(
                      annObjs.modelId,
                      true,
                      false,
                    );
                    tcapi.viewer.setObjectState(
                      {
                        modelObjectIds: [
                          {
                            modelId: annObjs.modelId,
                          },
                        ],
                      },
                      {
                        visible: true,
                        color: {
                          r: 255,
                          g: 0,
                          b: 0,
                        },
                      },
                    );
                  } else {
                    tcapi.viewer.setObjectState(
                      {
                        modelObjectIds: [
                          {
                            modelId: annObjs.modelId,
                          },
                        ],
                      },
                      {
                        visible: true,
                        color: {
                          r: 255,
                          g: 0,
                          b: 0,
                        },
                      },
                    );
                  }
                  dispatch(ShowAnnRequest(false));
                }}
              >
                Show Dimensions
              </Button>
            )}
          </div>
        </List.Item>
      </List>
      <List
        dataSource={views}
        loading={loading}
        renderItem={(item) => (
          <List.Item
            key={item.key}
            style={{
              alignContent: "center",
              height: "40px",
              marginLeft: "5px",
              marginRight: "5px",
            }}
          >
            <Text
              strong
              style={{
                marginLeft: "20px",
              }}
            >
              {item.name}
            </Text>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                columnGap: "2px",
              }}
            >
              {item.show ? (
                <Button
                  type="primary"
                  onClick={async () => {
                    const tcapi = await WorkspaceAPI.connect(window.parent);
                    const ifcBoltIds = views[0].ifcBoltIds;
                    var ifcBoltRuntimeIds =
                      await tcapi.viewer.convertToObjectRuntimeIds(
                        modelId,
                        ifcBoltIds,
                      );
                    await tcapi.viewer.isolateEntities([
                      {
                        modelId: modelId,
                        entityIds: [asm, ...ifcBoltRuntimeIds],
                      },
                    ]);
                    const annObjs = annIds.find(
                      (x) => x.name === views[0]?.file,
                    );
                    const updatedViews = views.map((view) => {
                      if (view.key === item.name) {
                        return {
                          ...view,
                          show: !item.show,
                        };
                      } else {
                        return view;
                      }
                    });
                    dispatch(
                      UpdateViewVisibilityRequest({
                        ...item,
                        show: !item.show,
                      }),
                    );

                    // toggle model visibility based on view show status
                    const viewsTobeHidden = updatedViews.filter(
                      (x) => x.show === false,
                    );
                    if (viewsTobeHidden.length === views.length) {
                      await tcapi.viewer.toggleModel(
                        annObjs.modelId,
                        false,
                        false,
                      );
                    } else {
                      const loadedModel = await tcapi.viewer.getLoadedModel(
                        annObjs.modelId,
                      );
                      if (loadedModel === undefined) {
                        await tcapi.viewer.toggleModel(
                          annObjs.modelId,
                          true,
                          false,
                        );
                      }
                    }

                    const allAnnIds = annObjs.annIds;
                    console.log(allAnnIds);
                    const annExtIdsToShow = [];
                    const annExtIdsToHide = [];
                    for (const view of updatedViews) {
                      const annIds = view.drawingObjects;
                      if (view.show) {
                        for (const x of allAnnIds) {
                          if (annIds.indexOf(x.annId) >= 0) {
                            annExtIdsToShow.push(x.id);
                          }
                        }
                      } else {
                        for (const x of allAnnIds) {
                          if (annIds.indexOf(x.annId) >= 0) {
                            annExtIdsToHide.push(x.id);
                          }
                        }
                      }
                    }

                    var annRuntimeIdsShow =
                      await tcapi.viewer.convertToObjectRuntimeIds(
                        annObjs.modelId,
                        annExtIdsToShow,
                      );
                    var annRuntimeIdsHide =
                      await tcapi.viewer.convertToObjectRuntimeIds(
                        annObjs.modelId,
                        annExtIdsToHide,
                      );

                    tcapi.viewer.setObjectState(
                      {
                        modelObjectIds: [
                          {
                            modelId: annObjs.modelId,
                            objectRuntimeIds: annRuntimeIdsShow,
                          },
                        ],
                      },
                      {
                        visible: true,
                        color: {
                          r: 255,
                          g: 0,
                          b: 0,
                        },
                      },
                    );
                    tcapi.viewer.setObjectState(
                      {
                        modelObjectIds: [
                          {
                            modelId: annObjs.modelId,
                            objectRuntimeIds: annRuntimeIdsHide,
                          },
                        ],
                      },
                      {
                        visible: false,
                      },
                    );
                  }}
                >
                  Hide
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={async () => {
                    const tcapi = await WorkspaceAPI.connect(window.parent);
                    const ifcBoltIds = views[0].ifcBoltIds;
                    var ifcBoltRuntimeIds =
                      await tcapi.viewer.convertToObjectRuntimeIds(
                        modelId,
                        ifcBoltIds,
                      );
                    await tcapi.viewer.isolateEntities([
                      {
                        modelId: modelId,
                        entityIds: [asm, ...ifcBoltRuntimeIds],
                      },
                    ]);
                    const annObjs = annIds.find(
                      (x) => x.name === views[0]?.file,
                    );
                    const updatedViews = views.map((view) => {
                      if (view.key === item.name) {
                        return {
                          ...view,
                          show: !item.show,
                        };
                      } else {
                        return view;
                      }
                    });
                    dispatch(
                      UpdateViewVisibilityRequest({
                        ...item,
                        show: !item.show,
                      }),
                    );

                    // toggle model visibility based on view show status
                    const viewsTobeHidden = updatedViews.filter(
                      (x) => x.show === false,
                    );
                    if (viewsTobeHidden.length === views.length) {
                      await tcapi.viewer.toggleModel(
                        annObjs.modelId,
                        false,
                        false,
                      );
                    } else {
                      const loadedModel = await tcapi.viewer.getLoadedModel(
                        annObjs.modelId,
                      );
                      if (loadedModel === undefined) {
                        await tcapi.viewer.toggleModel(
                          annObjs.modelId,
                          true,
                          false,
                        );
                      }
                    }

                    const allAnnIds = annObjs.annIds;
                    console.log(allAnnIds);
                    const annExtIdsToShow = [];
                    const annExtIdsToHide = [];
                    for (const view of updatedViews) {
                      const annIds = view.drawingObjects;
                      if (view.show) {
                        for (const x of allAnnIds) {
                          if (annIds.indexOf(x.annId) >= 0) {
                            annExtIdsToShow.push(x.id);
                          }
                        }
                      } else {
                        for (const x of allAnnIds) {
                          if (annIds.indexOf(x.annId) >= 0) {
                            annExtIdsToHide.push(x.id);
                          }
                        }
                      }
                    }

                    var annRuntimeIdsShow =
                      await tcapi.viewer.convertToObjectRuntimeIds(
                        annObjs.modelId,
                        annExtIdsToShow,
                      );
                    var annRuntimeIdsHide =
                      await tcapi.viewer.convertToObjectRuntimeIds(
                        annObjs.modelId,
                        annExtIdsToHide,
                      );

                    tcapi.viewer.setObjectState(
                      {
                        modelObjectIds: [
                          {
                            modelId: annObjs.modelId,
                            objectRuntimeIds: annRuntimeIdsShow,
                          },
                        ],
                      },
                      {
                        visible: true,
                        color: {
                          r: 255,
                          g: 0,
                          b: 0,
                        },
                      },
                    );
                    tcapi.viewer.setObjectState(
                      {
                        modelObjectIds: [
                          {
                            modelId: annObjs.modelId,
                            objectRuntimeIds: annRuntimeIdsHide,
                          },
                        ],
                      },
                      {
                        visible: false,
                      },
                    );
                  }}
                >
                  Show
                </Button>
              )}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

export default App;
