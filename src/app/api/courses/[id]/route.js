export async function GET(
    request: Request,
    { params } : { params: { id: string} }
) {
    const id = params.id;

    return NextResponse.json({id});
}
