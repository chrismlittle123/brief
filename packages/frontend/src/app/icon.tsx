import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default async function Icon() {
  const sacramentoFont = await fetch(
    new URL("https://fonts.gstatic.com/s/sacramento/v15/buEzpo6gcdjy0EiZMBUG4CMf_exL.woff2")
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 28,
          background: "black",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "Sacramento",
          paddingTop: 4,
        }}
      >
        B
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Sacramento",
          data: sacramentoFont,
          style: "normal",
        },
      ],
    }
  );
}
