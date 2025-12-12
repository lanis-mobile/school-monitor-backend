export type School = {
  id: string;
  name: string;
  city: string;
  bezirk: string;
  bezirk_id: string;
};

export const schoolList: {
  schools: School[];
  timestamp?: Date;
} = {
  schools: [],
};
export async function getSchool(schoolID: string) {
  if (
    schoolList.schools.length === 0 ||
    !schoolList.timestamp ||
    new Date().getTime() - schoolList.timestamp.getTime() > 2 * 60 * 60 * 1000
  ) {
    const response = await fetch(
      "https://startcache.schulportal.hessen.de/exporteur.php?a=schoollist",
    );
    const responseJson = await response.json();
    const converted = responseJson.map((bezirk: any) => {
      return bezirk.Schulen.map((schoolData: any): School => {
        return {
          id: schoolData.Id,
          name: schoolData.Name,
          city: schoolData.Ort,
          bezirk: bezirk.Name,
          bezirk_id: bezirk.Id,
        };
      });
    });
    schoolList.schools = converted.flat();
    schoolList.timestamp = new Date();
  }
  const result = schoolList.schools.find((school) => school.id === schoolID);
  return result || null;
}
