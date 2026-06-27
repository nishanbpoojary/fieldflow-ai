import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hookRuntime = vi.hoisted(() => ({
  states: [] as unknown[],
  initializedStates: new Set<number>(),
  refs: [] as Array<{ current: unknown }>,
  stateIndex: 0,
  refIndex: 0,
  idIndex: 0,
  beginRender() {
    this.stateIndex = 0;
    this.refIndex = 0;
    this.idIndex = 0;
  },
  reset() {
    this.states = [];
    this.initializedStates = new Set<number>();
    this.refs = [];
    this.stateIndex = 0;
    this.refIndex = 0;
    this.idIndex = 0;
  },
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    useId() {
      hookRuntime.idIndex += 1;
      return `test-id-${hookRuntime.idIndex}`;
    },
    useRef<T>(initialValue: T) {
      const index = hookRuntime.refIndex;
      hookRuntime.refIndex += 1;

      if (!hookRuntime.refs[index]) {
        hookRuntime.refs[index] = { current: initialValue };
      }

      return hookRuntime.refs[index] as { current: T };
    },
    useState<T>(initialState: T | (() => T)) {
      const index = hookRuntime.stateIndex;
      hookRuntime.stateIndex += 1;

      if (!hookRuntime.initializedStates.has(index)) {
        hookRuntime.states[index] =
          typeof initialState === "function"
            ? (initialState as () => T)()
            : initialState;
        hookRuntime.initializedStates.add(index);
      }

      const setState = (nextState: T | ((previousState: T) => T)) => {
        const previousState = hookRuntime.states[index] as T;
        hookRuntime.states[index] =
          typeof nextState === "function"
            ? (nextState as (previousState: T) => T)(previousState)
            : nextState;
      };

      return [hookRuntime.states[index] as T, setState] as const;
    },
  };
});

import {
  buildInviteUserRequestPayload,
  getInvitationResultMessage,
  invitationResultMessages,
  InviteUserForm,
  isInviteSubmitDisabled,
  parseInvitationApiResult,
} from "@/features/admin/invitations/components/invite-user-form";

type FetchMock = Mock<
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
>;

type ElementLike = {
  type: unknown;
  props: Record<string, unknown>;
};

type FormHarness = ReturnType<typeof createInviteFormHarness>;

const initialTeamId = "11111111-1111-4111-8111-111111111111";
const targetTeamId = "22222222-2222-4222-8222-222222222222";
const fixtureTeams = [
  {
    id: initialTeamId,
    name: "Metro North",
  },
  {
    id: targetTeamId,
    name: "Metro South",
  },
];

const genericUnavailableMessage =
  "Invitations are currently unavailable. Please try again later.";
const sentMessage =
  "Invitation sent. The recipient can use the email link to complete account setup.";
const deliveryUnknownMessage =
  "Delivery could not be confirmed. Please ask the recipient to check their email before sending another invitation.";

const forbiddenPayloadKeys = [
  "expiresAt",
  "expiry",
  "redirect",
  "redirectTo",
  "next",
  "returnTo",
  "organizationId",
  "actorProfileId",
  "profileId",
  "invitationId",
  "invitation_id",
  "status",
  "timestamp",
  "timestamps",
  "resendCount",
  "acceptedProfileId",
  "auditActor",
  "auditFields",
];

let fetchMock: FetchMock;

function isElementLike(value: unknown): value is ElementLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "props" in value &&
    typeof (value as { props: unknown }).props === "object" &&
    (value as { props: unknown }).props !== null
  );
}

function getChildren(node: ElementLike) {
  const children = node.props.children;

  if (Array.isArray(children)) {
    return children;
  }

  return children === undefined || children === null ? [] : [children];
}

function findAll(
  node: unknown,
  predicate: (element: ElementLike) => boolean,
): ElementLike[] {
  if (!isElementLike(node)) {
    return [];
  }

  return [
    ...(predicate(node) ? [node] : []),
    ...getChildren(node).flatMap((child) => findAll(child, predicate)),
  ];
}

function findOne(
  node: unknown,
  predicate: (element: ElementLike) => boolean,
  description: string,
) {
  const matches = findAll(node, predicate);

  if (matches.length !== 1) {
    throw new Error(`Expected one ${description}, found ${matches.length}.`);
  }

  return matches[0];
}

function getNodeText(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join("");
  }

  if (isElementLike(node)) {
    return getNodeText(node.props.children);
  }

  return "";
}

function getElementName(element: ElementLike) {
  return typeof element.props.name === "string" ? element.props.name : "";
}

function callHandler(
  element: ElementLike,
  handlerName: string,
  event: unknown,
) {
  const handler = element.props[handlerName];

  if (typeof handler !== "function") {
    throw new Error(`Missing ${handlerName} handler.`);
  }

  return (handler as (event: unknown) => unknown)(event);
}

function createJsonResponse(body: unknown): Response {
  return {
    json: async () => body,
  } as unknown as Response;
}

function createRejectingJsonResponse(error: Error): Response {
  return {
    json: async () => {
      throw error;
    },
  } as unknown as Response;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

function createInviteFormHarness(teams = fixtureTeams) {
  hookRuntime.reset();
  let tree: unknown;

  function render() {
    hookRuntime.beginRender();
    tree = InviteUserForm({ teams });
    return tree;
  }

  function field(name: string) {
    return findOne(
      tree,
      (element) => getElementName(element) === name,
      `${name} field`,
    );
  }

  function submitButton() {
    return findOne(
      tree,
      (element) => element.type === "button" && element.props.type === "submit",
      "submit button",
    );
  }

  function form() {
    return findOne(tree, (element) => element.type === "form", "form");
  }

  render();

  return {
    render,
    changeField(name: string, value: string) {
      callHandler(field(name), "onChange", { target: { value } });
      render();
    },
    async submit() {
      const result = callHandler(form(), "onSubmit", {
        preventDefault: vi.fn(),
      });

      if (result instanceof Promise) {
        await result;
      }
    },
    text() {
      return getNodeText(tree);
    },
    fieldValue(name: string) {
      return field(name).props.value;
    },
    isSubmitDisabled() {
      return submitButton().props.disabled === true;
    },
    buttonLabels() {
      return findAll(tree, (element) => element.type === "button").map(
        getNodeText,
      );
    },
  };
}

function fillInviteForm(
  harness: FormHarness,
  {
    email = "person@example.com",
    role = "manager",
    teamId = targetTeamId,
    jobTitle = "Regional Lead",
  }: {
    email?: string;
    role?: string;
    teamId?: string;
    jobTitle?: string;
  } = {},
) {
  harness.changeField("email", email);
  harness.changeField("role", role);
  harness.changeField("teamId", teamId);
  harness.changeField("jobTitle", jobTitle);
}

function getOnlyFetchRequestBody() {
  expect(fetchMock).toHaveBeenCalledTimes(1);

  const [url, init] = fetchMock.mock.calls[0];
  const headers = init?.headers as Record<string, string>;
  const parsedBody = JSON.parse(String(init?.body)) as Record<
    string,
    unknown
  >;

  expect(url).toBe("/api/admin/invitations");
  expect(init?.method).toBe("POST");
  expect(headers["Content-Type"]).toBe("application/json");

  return parsedBody;
}

async function submitAndRender(harness: FormHarness) {
  await harness.submit();
  harness.render();
}

async function submitWithMockedResult(
  harness: FormHarness,
  body: unknown,
) {
  fetchMock.mockResolvedValueOnce(createJsonResponse(body));
  await submitAndRender(harness);
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  hookRuntime.reset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  hookRuntime.reset();
});

describe("InviteUserForm component behavior", () => {
  it("submits a same-origin POST with the exact invitation payload and no privileged fields", async () => {
    const harness = createInviteFormHarness();

    fetchMock.mockResolvedValueOnce(createJsonResponse({ result: "sent" }));
    fillInviteForm(harness);

    await submitAndRender(harness);

    const parsedBody = getOnlyFetchRequestBody();

    expect(parsedBody).toEqual({
      email: "person@example.com",
      role: "manager",
      teamId: targetTeamId,
      jobTitle: "Regional Lead",
    });
    expect(Object.keys(parsedBody).sort()).toEqual([
      "email",
      "jobTitle",
      "role",
      "teamId",
    ]);

    for (const key of forbiddenPayloadKeys) {
      expect(parsedBody).not.toHaveProperty(key);
    }
  });

  it("submits a blank job title as null", async () => {
    const harness = createInviteFormHarness();

    fetchMock.mockResolvedValueOnce(createJsonResponse({ result: "sent" }));
    fillInviteForm(harness, { jobTitle: "   " });

    await submitAndRender(harness);

    expect(getOnlyFetchRequestBody()).toEqual({
      email: "person@example.com",
      role: "manager",
      teamId: targetTeamId,
      jobTitle: null,
    });
  });

  it("locks submission while pending and prevents duplicate POSTs", async () => {
    const deferred = createDeferred<Response>();
    const harness = createInviteFormHarness();

    fetchMock.mockReturnValueOnce(deferred.promise);
    fillInviteForm(harness);

    const firstSubmit = harness.submit();
    harness.render();

    expect(harness.isSubmitDisabled()).toBe(true);

    await harness.submit();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    deferred.resolve(createJsonResponse({ result: "sent" }));
    await firstSubmit;
    harness.render();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows sent feedback, clears safe text fields, and resets role and team", async () => {
    const harness = createInviteFormHarness();

    fillInviteForm(harness);
    await submitWithMockedResult(harness, { result: "sent" });

    expect(harness.text()).toContain(sentMessage);
    expect(harness.fieldValue("email")).toBe("");
    expect(harness.fieldValue("jobTitle")).toBe("");
    expect(harness.fieldValue("role")).toBe("sales_executive");
    expect(harness.fieldValue("teamId")).toBe(initialTeamId);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows delivery-state-unknown without clearing values, retry controls, or a second request", async () => {
    const harness = createInviteFormHarness();

    fillInviteForm(harness);
    await submitWithMockedResult(harness, {
      result: "delivery_state_unknown",
    });

    expect(harness.text()).toContain(deliveryUnknownMessage);
    expect(harness.fieldValue("email")).toBe("person@example.com");
    expect(harness.fieldValue("role")).toBe("manager");
    expect(harness.fieldValue("teamId")).toBe(targetTeamId);
    expect(harness.fieldValue("jobTitle")).toBe("Regional Lead");
    expect(harness.buttonLabels()).not.toContain("Retry");
    expect(harness.buttonLabels()).not.toContain("Resend");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      label: "network failure",
      setupFetch() {
        fetchMock.mockRejectedValueOnce(new Error("raw network failure"));
      },
      rawText: "raw network failure",
    },
    {
      label: "json parse failure",
      setupFetch() {
        fetchMock.mockResolvedValueOnce(
          createRejectingJsonResponse(new Error("raw json failure")),
        );
      },
      rawText: "raw json failure",
    },
    {
      label: "non-object payload",
      setupFetch() {
        fetchMock.mockResolvedValueOnce(
          createJsonResponse("raw payload text"),
        );
      },
      rawText: "raw payload text",
    },
    {
      label: "malformed result shape",
      setupFetch() {
        fetchMock.mockResolvedValueOnce(
          createJsonResponse({
            result: "sent",
            invitationId: "raw-invitation-id",
          }),
        );
      },
      rawText: "raw-invitation-id",
    },
    {
      label: "unknown result",
      setupFetch() {
        fetchMock.mockResolvedValueOnce(
          createJsonResponse({ result: "unexpected_value" }),
        );
      },
      rawText: "unexpected_value",
    },
  ])(
    "maps $label to generic unavailable without leaking raw details or retrying",
    async ({ setupFetch, rawText }) => {
      const harness = createInviteFormHarness();

      setupFetch();
      fillInviteForm(harness);

      await submitAndRender(harness);

      expect(harness.text()).toContain(genericUnavailableMessage);
      expect(harness.text()).not.toContain(rawText);
      expect(harness.fieldValue("email")).toBe("person@example.com");
      expect(harness.fieldValue("role")).toBe("manager");
      expect(harness.fieldValue("teamId")).toBe(targetTeamId);
      expect(harness.fieldValue("jobTitle")).toBe("Regional Lead");
      expect(harness.buttonLabels()).not.toContain("Retry");
      expect(harness.buttonLabels()).not.toContain("Resend");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );
});

describe("InviteUserForm helpers", () => {
  it("builds the narrow sender-route payload and trims optional job title", () => {
    const payload = buildInviteUserRequestPayload({
      email: "  new.person@example.com  ",
      role: "sales_executive",
      teamId: initialTeamId,
      jobTitle: "  Senior   Sales   Executive  ",
    });

    expect(payload).toEqual({
      email: "new.person@example.com",
      role: "sales_executive",
      teamId: initialTeamId,
      jobTitle: "Senior Sales Executive",
    });
    expect(Object.keys(payload).sort()).toEqual([
      "email",
      "jobTitle",
      "role",
      "teamId",
    ]);

    for (const key of forbiddenPayloadKeys) {
      expect(payload).not.toHaveProperty(key);
    }
  });

  it("sends a blank job title as null without adding protected fields", () => {
    const payload = buildInviteUserRequestPayload({
      email: "manager@example.com",
      role: "manager",
      teamId: targetTeamId,
      jobTitle: "   ",
    });

    expect(payload).toEqual({
      email: "manager@example.com",
      role: "manager",
      teamId: targetTeamId,
      jobTitle: null,
    });
  });

  it("maps every known sender result to the intended safe user-facing message", () => {
    expect(getInvitationResultMessage("sent")).toEqual({
      tone: "success",
      message: sentMessage,
    });
    expect(getInvitationResultMessage("already_invited").message).toBe(
      "An invitation has already been sent for this person.",
    );
    expect(getInvitationResultMessage("delivery_state_unknown").message).toBe(
      deliveryUnknownMessage,
    );
    expect(getInvitationResultMessage("delivery_failed").message).toBe(
      "The earlier invitation could not be delivered. Please contact an administrator before trying again.",
    );
    expect(getInvitationResultMessage("manager_unavailable").message).toBe(
      "This team already has a Manager.",
    );
    expect(getInvitationResultMessage("conflict").message).toBe(
      "This email cannot be invited at this time.",
    );
    expect(getInvitationResultMessage("invalid_request").message).toBe(
      "Please review the form details and try again.",
    );

    for (const result of [
      "forbidden",
      "unauthenticated",
      "unavailable",
    ] as const) {
      expect(getInvitationResultMessage(result).message).toBe(
        genericUnavailableMessage,
      );
    }

    expect(Object.keys(invitationResultMessages).sort()).toEqual([
      "already_invited",
      "conflict",
      "delivery_failed",
      "delivery_state_unknown",
      "forbidden",
      "invalid_request",
      "manager_unavailable",
      "sent",
      "unauthenticated",
      "unavailable",
    ]);
  });

  it("treats malformed or unknown route responses as generic unavailable", () => {
    expect(parseInvitationApiResult({ result: "sent" })).toBe("sent");
    expect(parseInvitationApiResult({ result: "already_invited" })).toBe(
      "already_invited",
    );

    for (const body of [
      null,
      undefined,
      "unexpected",
      42,
      [],
      {},
      { result: null },
      { result: "raw_provider_error" },
      { result: "sent", invitationId: "hidden" },
    ]) {
      expect(parseInvitationApiResult(body)).toBe("unavailable");
    }
  });

  it("disables submission while pending or when no authorized teams exist", () => {
    expect(
      isInviteSubmitDisabled({ hasTeamOptions: true, isPending: true }),
    ).toBe(true);
    expect(
      isInviteSubmitDisabled({ hasTeamOptions: false, isPending: false }),
    ).toBe(true);
    expect(
      isInviteSubmitDisabled({ hasTeamOptions: true, isPending: false }),
    ).toBe(false);
  });
});
