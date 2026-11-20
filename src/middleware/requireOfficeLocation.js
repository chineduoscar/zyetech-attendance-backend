const OFFICE_LOCATION = { latitude: 4.8301, longitude: 7.034431 };
const OFFICE_RADIUS_METERS = 200;
const DISTANCE_TOLERANCE_METERS = 0.000001;
const EARTH_RADIUS_METERS = 6_371_000;

const getDistanceInMeters = (first, second) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDifference = toRadians(second.latitude - first.latitude);
  const longitudeDifference = toRadians(second.longitude - first.longitude);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

export function requireOfficeLocation(req, res, next) {
  const { latitude, longitude } = req.body ?? {};
  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid latitude and longitude coordinates are required.",
      data: null,
    });
  }

  const distance = getDistanceInMeters(OFFICE_LOCATION, {
    latitude,
    longitude,
  });
  if (distance > OFFICE_RADIUS_METERS + DISTANCE_TOLERANCE_METERS) {
    return res.status(403).json({
      success: false,
      message:
        "Kindly ensure you are at the Zyetech office before marking your attendance.",
      data: null,
    });
  }

  return next();
}
