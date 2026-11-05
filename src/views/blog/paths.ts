import { getCollection } from "astro:content";

export async function getPostPaths() {
    const posts = await getCollection("posts");
    return posts.map((post) => ({ params: { slug: post.slug }, props: { post } }));
}
