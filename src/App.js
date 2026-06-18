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

  async function fetchData() {
    const tcapi = await WorkspaceAPI.connect(window.parent);
    const token = await tcapi.extension.requestPermission("accesstoken");
    window.localStorage.setItem("trimbleToken", token);
    const url = window.location.href;
    const propertyString = url.split("?")[1];
    const ifcGuid = propertyString?.split("ibim")[0];
    const fId = propertyString?.split("ibim")[1];
    if (!ifcGuid) {
      return;
    }
    if (ifcGuid.length !== 22) {
      return;
    }
    if (!fId) {
      return;
    }
    dispatch(
      GetDrawingRequest({
        id: fId,
      }),
    );
    var models;
    do {
      models = await tcapi.viewer.getModels();
    } while (models === undefined || models.length === 0);
    var asm;
    var modelId;
    console.log(models);
    for (const model of models) {
      const modelName = model.name;

      if (modelName.includes(".ifc") || modelName.includes(".tekla")) {
        const loadedModel = await tcapi.viewer.getLoadedModel(model.id);
        console.log("loadedModel", loadedModel);
        if (!loadedModel) {
          await tcapi.viewer.toggleModel(model.id, true, true);
        }
        await tcapi.viewer.setCamera("reset");

        let modelObjects;
        let retries = 0;
        const maxRetries = 20;

        do {
          modelObjects = await tcapi.viewer.getObjects();
          await new Promise((r) => setTimeout(r, 200));
          retries++;
        } while (
          (!modelObjects || modelObjects.length === 0) &&
          retries < maxRetries
        );

        if (!modelObjects || modelObjects.length === 0) {
          console.warn("No objects loaded for model:", model.id);
          continue;
        }

        console.log(modelObjects);

        const runtimeIds = await tcapi.viewer.convertToObjectRuntimeIds(
          model.id,
          [ifcGuid],
        );

        if (runtimeIds?.[0] >= 0) {
          asm = runtimeIds[0];
          modelId = model.id;
          break;
        }
      }
    }
    setAsm(asm);
    setModelId(modelId);
    if (asm >= 0) {
      await tcapi.viewer.setSelection({
        modelObjectIds: [
          {
            modelId: modelId,
            objectRuntimeIds: [asm],
          },
        ],
      });
      await tcapi.viewer.isolateEntities([
        {
          modelId: modelId,
          entityIds: [asm],
        },
      ]);
      await tcapi.viewer.setCamera({
        modelObjectIds: [
          {
            modelId: modelId,
            objectRuntimeIds: [asm],
          },
        ],
      });
    }

    //console.log(asm, modelId);
    // await tcapi.viewer.setCamera({
    //   position: {
    //     x: 1358.0000001497558,
    //     y: 2231.9649982910159,
    //     z: 111.12399997144837,
    //   },
    //   projectionType: "ortho",
    //   yaw: Math.PI,
    //   pitch: 0,
    // });
  }

  React.useEffect(() => {
    fetchData();
  }, []);
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
            <Button
              type="primary"
              icon={showAnn ? <EyeInvisibleFilled /> : <EyeFilled />}
              onClick={async () => {
                const tcapi = await WorkspaceAPI.connect(window.parent);
                const annObjs = annIds.find((x) => x.name === views[0]?.file);
                console.log(annIds);
                console.log(views[0]);
                const loadedModel = await tcapi.viewer.getLoadedModel(
                  annObjs.modelId,
                );

                if (loadedModel === undefined) {
                  await tcapi.viewer.toggleModel(
                    annObjs.modelId,
                    !showAnn,
                    false,
                  );
                  if (!showAnn) {
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
                        // color: {
                        //   r: 0,
                        //   g: 0,
                        //   b: 0,
                        // },
                      },
                    );
                  }
                } else {
                  if (showAnn) {
                    await tcapi.viewer.toggleModel(
                      annObjs.modelId,
                      false,
                      false,
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
                        // color: {
                        //   r: 0,
                        //   g: 0,
                        //   b: 0,
                        // },
                      },
                    );
                  }
                }
                dispatch(ShowAnnRequest(showAnn));
              }}
            />
            <Text ellipsis strong style={{ fontSize: "15px" }}>
              {views[0]?.file}
            </Text>
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
              <Button
                type="primary"
                icon={item.show ? <EyeInvisibleFilled /> : <EyeFilled />}
                onClick={async () => {
                  const tcapi = await WorkspaceAPI.connect(window.parent);
                  const annObjs = annIds.find((x) => x.name === views[0]?.file);
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
                      // color: {
                      //   r: 0,
                      //   g: 0,
                      //   b: 0,
                      // },
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
              />
              {/* <Button
                type="primary"
                icon={<ScissorOutlined />}
                onClick={() => {}}
              /> */}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

export default App;
