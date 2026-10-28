import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 100 * 1024;
const MAX_REQUEST_SIZE = 2 * 1024 * 1024;

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function asDate(value) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export async function POST(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_SIZE) {
    return NextResponse.json({ error: "The form upload is too large." }, { status: 413 });
  }

  try {
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "The form upload is malformed." }, { status: 400 });
    }
    const rawDetails = formData.get("details");
    if (typeof rawDetails !== "string") {
      return NextResponse.json({ error: "Form details are missing." }, { status: 400 });
    }

    let details;
    try {
      details = JSON.parse(rawDetails);
    } catch {
      return NextResponse.json({ error: "Form details are invalid." }, { status: 400 });
    }

    if (!details || typeof details !== "object" || Array.isArray(details)) {
      return NextResponse.json({ error: "Form details are invalid." }, { status: 400 });
    }

    const requiredText = [
      "employeeId", "employeeName", "gender", "mobileNumber", "aadharNumber",
      "maritalStatus", "address", "state", "pincode", "fatherName", "motherName",
    ];
    if (requiredText.some((key) => typeof details[key] !== "string" || !details[key].trim())) {
      return NextResponse.json({ error: "Complete all required form details." }, { status: 400 });
    }
    if (!isValidDate(details.dateOfJoining) || !isValidDate(details.dateOfBirth)) {
      return NextResponse.json({ error: "Enter valid employee dates." }, { status: 400 });
    }
    if (!/^[6-9]\d{9}$/.test(details.mobileNumber) ||
      typeof details.aadharNumber !== "string" || !/^\d{12}$/.test(details.aadharNumber) ||
      !/^\d{6}$/.test(details.pincode)) {
      return NextResponse.json({ error: "Mobile, Aadhaar, or pincode is invalid." }, { status: 400 });
    }
    if (details.hasPreviousEsi === true &&
      (typeof details.previousEsiNumber !== "string" || !/^\d{1,20}$/.test(details.previousEsiNumber))) {
      return NextResponse.json({ error: "Previous ESI number must contain between 1 and 20 digits." }, { status: 400 });
    }

    const childCount = Number(details.childCount);
    if (!Number.isInteger(childCount) || childCount < 0 || childCount > 5 ||
      !Array.isArray(details.children) || details.children.length !== childCount) {
      return NextResponse.json({ error: "Child details are invalid." }, { status: 400 });
    }
    if (details.children.some((child) =>
      !child || typeof child.name !== "string" || !child.name.trim() || !isValidDate(child.dateOfBirth))) {
      return NextResponse.json({ error: "Complete every child's name and date of birth." }, { status: 400 });
    }

    const married = details.maritalStatus === "Married";
    if (married && (typeof details.spouseName !== "string" || !details.spouseName.trim() ||
      !isValidDate(details.spouseDateOfBirth))) {
      return NextResponse.json({ error: "Complete the spouse details." }, { status: 400 });
    }
    if (details.includesParents && (!isValidDate(details.fatherDateOfBirth) ||
      !isValidDate(details.motherDateOfBirth))) {
      return NextResponse.json({ error: "Enter valid dates of birth for both parents." }, { status: 400 });
    }
    if (typeof details.includesParents !== "boolean") {
      return NextResponse.json({ error: "Parent inclusion selection is required." }, { status: 400 });
    }

    const imageNames = [
      "photo",
      ...(married ? ["spousePhoto"] : []),
      ...Array.from({ length: childCount }, (_, index) => `child${index + 1}Photo`),
      ...(details.includesParents ? ["fatherPhoto", "motherPhoto"] : []),
    ];
    const images = {};
    for (const name of imageNames) {
      const file = formData.get(name);
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: `The ${name} image is required.` }, { status: 400 });
      }
      if (file.size >= MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: `The ${name} image must be smaller than 100 KB.` }, { status: 400 });
      }
      if (file.type !== "image/jpeg") {
        return NextResponse.json({ error: `The ${name} image must be a compressed JPEG.` }, { status: 400 });
      }
      images[name] = { data: Buffer.from(await file.arrayBuffer()), mimeType: file.type };
    }

    const data = {
      EmployeeId: details.employeeId.trim(),
      EmployeeName: details.employeeName.trim(),
      DateOfJoining: asDate(details.dateOfJoining),
      DateOfBirth: asDate(details.dateOfBirth),
      Gender: details.gender,
      MobileNumber: details.mobileNumber,
      AadharNumber: details.aadharNumber,
      MaritalStatus: details.maritalStatus,
      HasPreviousEsi: details.hasPreviousEsi === true,
      PreviousEsiNumber: details.hasPreviousEsi ? details.previousEsiNumber : null,
      Address: details.address.trim(),
      State: details.state,
      Pincode: details.pincode,
      Photograph: images.photo.data,
      PhotographMimeType: images.photo.mimeType,
      FatherName: details.fatherName.trim(),
      MotherName: details.motherName.trim(),
      SpouseName: married ? details.spouseName.trim() : null,
      SpouseDateOfBirth: married ? asDate(details.spouseDateOfBirth) : null,
      SpousePhotograph: images.spousePhoto?.data ?? null,
      SpousePhotoMimeType: images.spousePhoto?.mimeType ?? null,
      ChildCount: childCount,
      IncludesParents: details.includesParents,
      FatherDateOfBirth: details.includesParents ? asDate(details.fatherDateOfBirth) : null,
      FatherPhotograph: images.fatherPhoto?.data ?? null,
      FatherPhotoMimeType: images.fatherPhoto?.mimeType ?? null,
      MotherDateOfBirth: details.includesParents ? asDate(details.motherDateOfBirth) : null,
      MotherPhotograph: images.motherPhoto?.data ?? null,
      MotherPhotoMimeType: images.motherPhoto?.mimeType ?? null,
    };

    for (let index = 0; index < 5; index++) {
      const child = details.children[index];
      const image = images[`child${index + 1}Photo`];
      const fieldIndex = index + 1;
      data[`Child${fieldIndex}Name`] = child?.name.trim() ?? null;
      data[`Child${fieldIndex}DateOfBirth`] = child ? asDate(child.dateOfBirth) : null;
      data[`Child${fieldIndex}Photograph`] = image?.data ?? null;
      data[`Child${fieldIndex}PhotoMimeType`] = image?.mimeType ?? null;
    }

    await prisma.esiEmployee.upsert({
      where: { EmployeeId: data.EmployeeId },
      create: data,
      update: data,
    });

    return NextResponse.json({ success: true, employeeId: data.EmployeeId });
  } catch (error) {
    if (error instanceof Error && error.message.includes("image")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to save ESI form:", error);
    return NextResponse.json({ error: "Unable to save the ESI form. Please try again." }, { status: 500 });
  }
}
