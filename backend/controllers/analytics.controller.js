import { getMetaAnalytics } from "../services/metaAnalytics.service.js";

export async function metaAnalyticsController(req, res) {

  try {

    const { workspaceId } = req.params;
    const days = Number(req.query.days || 30);

    const data = await getMetaAnalytics(workspaceId, days);

    res.json(data);

  } catch (err) {

    console.error("META ANALYTICS ERROR", err);

    res.status(500).json({
      error: "Meta analytics failed"
    });
  }

}