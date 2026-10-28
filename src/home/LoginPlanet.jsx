import Globe from "@site/components/Globe.jsx";

/** Terra animada do site, nascendo atrás do painel branco do login. */
export default function LoginPlanet() {
  return (
    <div className="lp" aria-hidden="true">
      <Globe lockDay />
    </div>
  );
}
