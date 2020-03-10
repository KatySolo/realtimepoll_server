export type SessionType = {
    id: number,
    name: string
}

export type SessionDataType = {
    lector: LectorResultType,
    results: ListenersResultType,
    delta: ListenersResultType,
    coments: CommentsType,
    rawResults: PersonDataType[]
}

export type ResultsType = {
    [key: string]: PersonDataType[] 
}

export type LectorResultType = {
    name: string,
    form: string,
    content: string,
    interest: string;
}

export type ListenersResultType = {
    form: number,
    content: number,
    interest: number;
}

export type CommentsType = {
    [key: string]: string
}

export type PersonDataType = {
    name: string,
    form: string;
    content: string,
    interest: string,
    comment: string,
    isLector: boolean
}

export type ParsedDate = {
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number
}